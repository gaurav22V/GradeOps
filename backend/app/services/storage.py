import os
import cloudinary
import cloudinary.uploader
from app.core.config import settings

class StorageService:
    def __init__(self):
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET")
        )

    def upload_file(self, file_path: str, object_name: str) -> str:
        """
        Uploads a local image crop to Cloudinary and returns its public secure URL.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Local file not found for upload: {file_path}")
            
        try:
            public_id = os.path.splitext(object_name)[0]
            response = cloudinary.uploader.upload(
                file_path,
                public_id=f"gradeops/crops/{public_id}",
                overwrite=True,
                resource_type="image"
            )
            
            # Return the secure HTTPS URL
            return response.get("secure_url")
            
        except Exception as e:
            print(f"Cloudinary upload failed: {e}")
            raise e

# Instantiate the service singleton
storage_service = StorageService()