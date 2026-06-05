import os
import boto3
from botocore.exceptions import NoCredentialsError
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.bucket_name = os.getenv("AWS_BUCKET_NAME", "gradeops-crops")
        self.use_s3 = bool(os.getenv("AWS_ACCESS_KEY_ID"))

    def upload_file(self, file_path: str, object_name: str) -> str:
        """Uploads a file to S3 and returns the public URL, or keeps it local if no S3."""
        if self.use_s3:
            try:
                self.s3.upload_file(
                    file_path, self.bucket_name, object_name,
                    ExtraArgs={'ACL': 'public-read'} 
                )
                os.remove(file_path) 
                return f"https://{self.bucket_name}.s3.amazonaws.com/{object_name}"
            except NoCredentialsError:
                pass
        
        return f"/crops/{object_name}"

storage_service = StorageService()