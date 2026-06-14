import os
import shutil
import io
import csv
from typing import List, Dict
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db, SessionLocal
from app.db import models
from app.core.security import get_current_user
from app.services.ocr_service import ocr_service
from app.services.storage import storage_service
from app.ai_agents.graph import grading_brain
from app.ai_agents.nodes.plagiarize import plagiarism_detector

router = APIRouter()

class ExamCreate(BaseModel):
    title: str
    rubric: List[Dict]

class ReviewSubmit(BaseModel):
    final_score: float
    status: models.GradeStatus 

async def process_exam_pipeline(exam_id: int, file_path: str, student_id: str, original_filename: str):
    """Runs in the background."""
    async with SessionLocal() as db:
        try:
            result = await db.execute(select(models.Exam).filter(models.Exam.id == exam_id))
            exam = result.scalars().first()
            
            ocr_result = ocr_service.extract_and_transcribe(file_path, student_id, str(exam_id))
            print("--- 1. ABOUT TO UPLOAD TO CLOUDINARY ---")
            print(f"Crop path exists?: {os.path.exists(ocr_result['crop_path'])}")

            cloud_url = storage_service.upload_file(ocr_result["crop_path"], os.path.basename(ocr_result["crop_path"]))

            print(f"--- 2. CLOUDINARY RETURNED: {cloud_url} ---")
            
            submission = models.Submission(
                exam_id=exam_id,
                student_identifier=student_id,
                file_url=cloud_url,  
                extracted_text=ocr_result["transcribed_text"],
            )
            db.add(submission)
            await db.commit()
            await db.refresh(submission) 

            past_subs_result = await db.execute(select(models.Submission).filter(models.Submission.exam_id == exam_id))
            past_texts = [sub.extracted_text for sub in past_subs_result.scalars().all() if sub.extracted_text]

            if len(past_texts) == 0:
                is_flagged = False
            else:
                is_flagged = plagiarism_detector.check_similarity(ocr_result["transcribed_text"], past_texts)
            
            initial_state = {
                "student_transcript": ocr_result["transcribed_text"],
                "rubric": exam.rubric, "criterion_index": 0, "evaluations": [], "total_score": 0.0
            }
            final_state = grading_brain.invoke(initial_state)

            db.add(models.GradeRecord(
                submission_id=submission.id, ai_score=final_state["total_score"],
                ai_justification=final_state["evaluations"], plagiarism_flag=is_flagged,
                status=models.GradeStatus.NEEDS_REVIEW
            ))
            await db.commit()
        except Exception as e:
            import traceback
            print("CRITICAL ERROR IN BACKGROUND.")
            traceback.print_exc()  
        finally:
            if os.path.exists(file_path):
                os.remove(file_path) 

@router.post("/exams/")
async def create_exam(exam_in: ExamCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can create exams")
    
    exam = models.Exam(title=exam_in.title, rubric=exam_in.rubric, instructor_id=current_user["id"])
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    return exam

@router.post("/exams/{exam_id}/submissions/")
async def upload_submission(
    exam_id: int, 
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(models.Exam).filter(models.Exam.id == exam_id))
    exam = result.scalars().first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    file_path = f"./uploads/{file.filename}"
    os.makedirs("./uploads", exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    student_id = file.filename.split(".")[0]
    
    background_tasks.add_task(process_exam_pipeline, exam_id, file_path, student_id, file.filename)
    
    return {"message": "File uploaded successfully. AI is processing in the background."}

@router.get("/dashboard/pending")
async def get_pending_reviews(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(models.GradeRecord)
        .filter(models.GradeRecord.status == models.GradeStatus.NEEDS_REVIEW)
        .options(selectinload(models.GradeRecord.submission)) 
    )
    return result.scalars().all()

@router.put("/reviews/{record_id}")
async def submit_human_review(record_id: int, review_in: ReviewSubmit, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = await db.execute(select(models.GradeRecord).filter(models.GradeRecord.id == record_id))
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Grade record not found")
    
    record.final_score = review_in.final_score
    record.status = review_in.status
    record.ta_id = current_user["id"]
    
    await db.commit()
    return {"message": "Review saved successfully"}

@router.get("/exams/{exam_id}/export")
async def export_grades_csv(exam_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(models.Submission)
        .filter(models.Submission.exam_id == exam_id)
        .options(selectinload(models.Submission.grade_record))
    )
    submissions = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Final Score", "Status", "Plagiarism Flag"])

    for sub in submissions:
        if sub.grade_record:
            score = sub.grade_record.final_score if sub.grade_record.final_score is not None else sub.grade_record.ai_score
            writer.writerow([sub.student_identifier, score, sub.grade_record.status.value, sub.grade_record.plagiarism_flag])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]), 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename=exam_{exam_id}_grades.csv"}
    )

from sqlalchemy import delete

@router.delete("/dev/nuke-database")
async def nuke_database(db: AsyncSession = Depends(get_db)):
    """Temporary dev endpoint to clear ghost data."""
    try:
        await db.execute(delete(models.GradeRecord))
        await db.execute(delete(models.Submission))
        await db.execute(delete(models.Exam))
        await db.commit()
        return {"message": "Ghost data successfully vaporized. Database is clean."}
    except Exception as e:
        await db.rollback()
        return {"error": str(e)}