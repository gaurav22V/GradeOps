from typing import List, Dict
from pydantic import BaseModel, Field
from openai import OpenAI
from app.core.config import settings

# Define the exact data structure the frontend dashboard needs to display
class QuestionEvaluation(BaseModel):
    question_number: str = Field(description="The number of the question being graded.")
    max_points: float = Field(description="Maximum points possible for this question.")
    points_awarded: float = Field(description="Points awarded based on criteria met.")
    justification: str = Field(description="Detailed breakdown of why points were given or deducted matching the rubric.")

class ExamGradingResult(BaseModel):
    total_score: float = Field(description="Sum of all points awarded across all questions.")
    evaluations: List[QuestionEvaluation] = Field(description="List of detailed grading per question.")

from google import genai
from google.genai import types

class GradingAgent:
    def __init__(self):
        # 1. Initialize the Google client instead of OpenAI
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def evaluate_submission(self, student_transcript: str, rubric: Dict) -> ExamGradingResult:
        import json
        
        # 2. Use Gemini's structure for JSON output
        user_content = f"""
        EXAMINATION RUBRIC: {json.dumps(rubric, indent=2)}
        STUDENT TRANSCRIPT TO GRADE: {student_transcript}
        """

        # 3. Use Gemini's response schema enforcement
        response = self.client.models.generate_content(
            model="gemini-2.0-flash", # Use the latest Gemini model
            contents=user_content,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExamGradingResult, # Gemini enforces your Pydantic model
            ),
        )

        return ExamGradingResult.model_validate_json(response.text)

# Instantiate the agent
grading_agent = GradingAgent()