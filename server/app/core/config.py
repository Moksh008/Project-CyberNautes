from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # Neo4j
    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str
    
    # Threat Intel & LLM APIs
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    NVD_API_KEY: Optional[str] = None
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_API_KEY: Optional[str] = None
    FIREBASE_AUTH_DOMAIN: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_STORAGE_BUCKET: Optional[str] = None
    FIREBASE_MESSAGING_SENDER_ID: Optional[str] = None
    FIREBASE_APP_ID: Optional[str] = None
    FIREBASE_MEASUREMENT_ID: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
