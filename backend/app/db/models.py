import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Float, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# ---------------------------------------------------------
# Enums for strict state management
# ---------------------------------------------------------
class UserRole(str, enum.Enum):
    INSTRUCTOR = "instructor"
    TA = "ta"

class GradeStatus(str, enum.Enum):
    PENDING_AI = "pending_ai"     
    NEEDS_REVIEW = "needs_review"  
    APPROVED = "approved"          
    OVERRIDDEN = "overridden"     

# ---------------------------------------------------------
# Database Tables
# ---------------------------------------------------------
class User(Base):
    """Handles Instructors and TAs"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.TA, nullable=False)

    exams = relationship("Exam", back_populates="instructor")
    reviews = relationship("GradeRecord", back_populates="reviewed_by_ta")


class Exam(Base):
    """Stores the bulk exam metadata and the strict JSON rubric"""
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"))
    rubric = Column(JSONB, nullable=False) # The JSON Rubric for the LangGraph agent
    created_at = Column(DateTime, default=datetime.utcnow)

    instructor = relationship("User", back_populates="exams")
    submissions = relationship("Submission", back_populates="exam", cascade="all, delete-orphan")


class Submission(Base):
    """A single student's scanned exam paper"""
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"))
    student_identifier = Column(String, nullable=True) # E.g., Student ID extracted via OCR
    file_url = Column(String, nullable=False) # Cloud storage link to the cropped scan
    extracted_text = Column(Text, nullable=True) # Raw OCR output for the LLM
    
    exam = relationship("Exam", back_populates="submissions")
    grade_record = relationship("GradeRecord", back_populates="submission", uselist=False)


class GradeRecord(Base):
    """The HITL (Human-in-the-loop) intersection point"""
    __tablename__ = "grade_records"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), unique=True)
    
    # AI Output Data
    ai_score = Column(Float, nullable=True)
    ai_justification = Column(JSONB, nullable=True) # Structured textual justifications
    plagiarism_flag = Column(Boolean, default=False)
    
    # Human Review Data
    status = Column(Enum(GradeStatus), default=GradeStatus.PENDING_AI)
    final_score = Column(Float, nullable=True)
    ta_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Who reviewed it
    reviewed_at = Column(DateTime, nullable=True)

    submission = relationship("Submission", back_populates="grade_record")
    reviewed_by_ta = relationship("User", back_populates="reviews")