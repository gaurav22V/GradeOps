import os
import uuid
import time
import io
import base64
import fitz  
from PIL import Image
from groq import Groq
from app.core.config import settings

class OCRService:
    def __init__(self):
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        self.model_name = "meta-llama/llama-4-scout-17b-16e-instruct"
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
        """Slices the PDF, saves the crop, and sends it to Groq Vision for transcription."""
        # Lower the DPI to 100 to prevent massive memory paylood and potential OOM crashes.
        #  This will reduce OCR accuracy but is necessary for stability.
        images = self.split_pdf_to_images(pdf_path, dpi=100) 
        
        image = images[0] 
        
        crop_filename = f"{exam_id}_{student_id}_{uuid.uuid4().hex[:6]}.png"
        crop_path = os.path.join(self.crop_output_dir, crop_filename)
        image.save(crop_path) 

        # Convert the image to RGB => so it can be saved as a JPEG
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Save to a memory buffer as a JPEG 
        buf = io.BytesIO()
        image.save(buf, format="JPEG", quality=85)
        base64_image = base64.b64encode(buf.getvalue()).decode('utf-8')

        prompt = (
            "This is a scanned handwritten student exam answer. "
            "Transcribe every word exactly as written, including crossed-out text. "
            "Output ONLY the transcribed text, nothing else."
        )

        response = self.groq_client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            temperature=0.0
        )
        
        time.sleep(0.5) 
        
        return {
            "student_id": student_id,
            "transcribed_text": response.choices[0].message.content.strip(),
            "crop_path": crop_path
        }

ocr_service = OCRService()