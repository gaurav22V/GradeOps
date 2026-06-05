import json
import time
from typing import TypedDict, List, Dict
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings

# 1. Define the Graph State
class GradingState(TypedDict):
    student_transcript: str
    rubric: List[Dict]          
    criterion_index: int        
    evaluations: List[Dict]    
    total_score: float

# 2. Define the LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=settings.GOOGLE_API_KEY, 
    temperature=0.0
)

# 3. Define the Grading Node
def grade_criterion_node(state: GradingState) -> GradingState:
    idx = state["criterion_index"]
    criteria = state["rubric"]
    
    if idx >= len(criteria):
        return state

    criterion = criteria[idx]
    
    system_prompt = (
        "You are a strict university grader. Evaluate the student's answer against the criterion. "
        "Award partial credit if allowed. Respond ONLY with valid JSON: "
        '{"awarded_points": <float>, "justification": "<one sentence>"}'
    )
    
    human_prompt = (
        f"STUDENT ANSWER:\n{state['student_transcript']}\n\n"
        f"CRITERION: {criterion.get('description')}\n"
        f"MAX POINTS: {criterion.get('max_points')}\n"
        f"REQUIRED KEYWORDS: {criterion.get('keywords', 'none')}\n"
    )

    messages = [SystemMessage(content=system_prompt), HumanMessage(content=human_prompt)]
    
    try:
        #For Rate Limit
        response = llm.invoke(messages)
        time.sleep(0.5)
        
        content = response.content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        
        awarded = float(parsed.get("awarded_points", 0))
        awarded = max(0.0, min(awarded, float(criterion.get("max_points", 0))))
        justification = parsed.get("justification", "No justification provided.")
        
    except Exception as e:
        awarded = 0.0
        justification = f"Error parsing AI output: {str(e)}"

    evaluation = {
        "question_number": criterion.get("question_number", str(idx + 1)),
        "max_points": criterion.get("max_points"),
        "points_awarded": awarded,
        "justification": justification
    }

    state["evaluations"].append(evaluation)
    state["total_score"] += awarded
    state["criterion_index"] += 1
    
    return state

def should_continue(state: GradingState) -> str:
    return "grade_criterion" if state["criterion_index"] < len(state["rubric"]) else END

workflow = StateGraph(GradingState)
workflow.add_node("grade_criterion", grade_criterion_node)
workflow.set_entry_point("grade_criterion")
workflow.add_conditional_edges("grade_criterion", should_continue, {
    "grade_criterion": "grade_criterion",
    END: END
})

grading_brain = workflow.compile()

import random

def mock_grade_criterion_node(state: GradingState) -> GradingState:
    # This bypasses Gemini entirely for testing
    idx = state["criterion_index"]
    criteria = state["rubric"]
    criterion = criteria[idx]
    
    # Generate fake but realistic data
    awarded = round(random.uniform(0, criterion.get("max_points", 0)), 1)
    
    evaluation = {
        "question_number": criterion.get("question_number", str(idx + 1)),
        "max_points": criterion.get("max_points"),
        "points_awarded": awarded,
        "justification": "Mock grade (API Quota limited): Student demonstrated understanding."
    }
    
    state["evaluations"].append(evaluation)
    state["total_score"] += awarded
    state["criterion_index"] += 1
    return state