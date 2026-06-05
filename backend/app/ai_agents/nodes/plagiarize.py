import google.generativeai as genai
from app.core.config import settings

class PlagiarismDetector:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def check_similarity(self, current_transcript: str, other_transcripts: list[str]) -> bool:
        if not other_transcripts:
            return False
            
        prompt = (
            "You are an academic integrity AI. Compare 'Student A' against the list of 'Other Students'. "
            "Ignore simple numerical answers. Look for identically structured sentences, identical "
            "weird logical leaps, or identical rare spelling mistakes. "
            f"Student A: {current_transcript}\n"
            f"Other Students: {other_transcripts}\n"
            "Return ONLY 'FLAG' if there is strong evidence of copying, otherwise return 'CLEAR'."
        )
        
        response = self.model.generate_content(prompt)
        return "FLAG" in response.text.upper()

plagiarism_detector = PlagiarismDetector()