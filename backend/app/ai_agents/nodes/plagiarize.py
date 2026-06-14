from groq import Groq
from app.core.config import settings

class PlagiarismDetector:
    def __init__(self):
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        self.model_name = "llama-3.3-70b-versatile"

    def check_similarity(self, current_transcript: str, other_transcripts: list[str]) -> bool:
        if not other_transcripts:
            return False
            
        prompt = (
            "You are an academic integrity AI. Compare 'Student A' against the list of 'Other Students'. "
            "Ignore simple numerical answers. Look for identically structured sentences, identical "
            "weird logical leaps, or identical rare spelling mistakes. \n\n"
            f"Student A: {current_transcript}\n\n"
            f"Other Students: {other_transcripts}\n\n"
            "Return ONLY 'FLAG' if there is strong evidence of copying, otherwise return 'CLEAR'."
        )
        
        try:
            response = self.groq_client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.0
            )
            
            result_text = response.choices[0].message.content.strip().upper()
            return "FLAG" in result_text
            
        except Exception as e:
            print(f"Plagiarism detection background error: {e}")
            return False

plagiarism_detector = PlagiarismDetector()