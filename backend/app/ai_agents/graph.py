import json
import time
from typing import TypedDict, List, Dict
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
from app.core.config import settings
from dotenv import load_dotenv

load_dotenv()  

# Grading State Definition
class GradingState(TypedDict):
    student_transcript: str
    rubric: List[Dict]          
    criterion_index: int        
    evaluations: List[Dict]    
    total_score: float

# LLM Initialization
from langchain_groq import ChatGroq

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=settings.GROQ_API_KEY,
    temperature=0.0
)

def grade_all_criteria_node(state: GradingState) -> GradingState:
    criteria = state["rubric"]
    
    system_prompt = (
        "You are an expert university grader. You will be provided with a student's answer "
        "and a complete grading rubric containing multiple criteria. "
        "Evaluate the student's answer against ALL criteria at once. "
        "Return ONLY a valid JSON array of objects. Each object must have exactly these keys: "
        "'question_number' (string), 'points_awarded' (float), and 'justification' (string)."
    )
    
    # Format the entire rubric 
    rubric_text = json.dumps([{
        "question_number": c.get("question_number"),
        "description": c.get("description"),
        "max_points": c.get("max_points"),
        "keywords": c.get("keywords", "")
    } for c in criteria], indent=2)

    human_prompt = (
        f"STUDENT ANSWER:\n{state['student_transcript']}\n\n"
        f"FULL RUBRIC:\n{rubric_text}\n\n"
        "Provide the JSON array with your evaluations now:"
    )

    messages = [SystemMessage(content=system_prompt), HumanMessage(content=human_prompt)]
    
    try:
        response = llm.invoke(messages)
        content = response.content.replace("```json", "").replace("```", "").strip()
        evaluations = json.loads(content)
        
        total_score = 0.0
        state_evals = []
        
        for ev in evaluations:
            awarded = float(ev.get("points_awarded", 0))
            max_pts = next((float(c.get("max_points", 0)) for c in criteria if str(c.get("question_number")) == str(ev.get("question_number"))), awarded)
            awarded = max(0.0, min(awarded, max_pts))
            
            state_evals.append({
                "question_number": str(ev.get("question_number")),
                "max_points": max_pts,
                "points_awarded": awarded,
                "justification": ev.get("justification", "No justification provided.")
            })
            total_score += awarded
        
        state["evaluations"] = state_evals
        state["total_score"] = total_score
        
    except Exception as e:
        print(f"Failed to parse consolidated grade: {e}")
        state["evaluations"] = []
        state["total_score"] = 0.0

    state["criterion_index"] = len(criteria)
    return state

workflow = StateGraph(GradingState)
workflow.add_node("grade_all", grade_all_criteria_node) 
workflow.set_entry_point("grade_all")
workflow.add_edge("grade_all", END)

grading_brain = workflow.compile()