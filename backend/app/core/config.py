from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GradeOps API"
    
    # Database
    DATABASE_URL: str
    
    # JWT Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    
    GOOGLE_API_KEY: str
    class Config:
        env_file = ".env"

# Instantiate it so we can import `settings` anywhere in the app
settings = Settings()