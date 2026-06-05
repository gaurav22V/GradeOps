import os
import uuid
import time
import io
import fitz  
from PIL import Image
import google.generativeai as genai
from app.core.config import settings

class OCRService:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY) 
        self.model = genai.GenerativeModel("gemini-2.0-flash")
        self.crop_output_dir = "./crops"
        os.makedirs(self.crop_output_dir, exist_ok=True)
    def split_pdf_to_images(self, pdf_path: str, dpi: int = 200) -> list[Image.Image]:
        """Converts a PDF into a list of PIL Images."""
        doc = fitz.open(pdf_path)
        images = []
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        for page in doc:
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            images.append(img)
        doc.close()
        return images

    def extract_and_transcribe(self, pdf_path: str, student_id: str, exam_id: str) -> dict:
        """Slices the PDF, saves the crop, and sends it to Gemini for transcription."""
        images = self.split_pdf_to_images(pdf_path)
        
        image = images[0] 
        
        crop_filename = f"{exam_id}_{student_id}_{uuid.uuid4().hex[:6]}.png"
        crop_path = os.path.join(self.crop_output_dir, crop_filename)
        image.save(crop_path)

        buf = io.BytesIO()
        image.save(buf, format="PNG")
        image_part = {"mime_type": "image/png", "data": buf.getvalue()}

        prompt = (
            "This is a scanned handwritten student exam answer. "
            "Transcribe every word exactly as written, including crossed-out text. "
            "Output ONLY the transcribed text, nothing else."
        )

        response = self.model.generate_content([prompt, image_part])
        #for Rate limit
        time.sleep(0.5) 
        
        return {
            "student_id": student_id,
            "transcribed_text": response.text.strip(),
            "crop_path": crop_path
        }

ocr_service = OCRService()