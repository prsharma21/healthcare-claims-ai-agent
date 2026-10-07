import os
from pathlib import Path

from dotenv import load_dotenv

# Local development reads backend/claims-api/.env (git-ignored). Real environment variables take precedence.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DEFAULT_CORS_ALLOW_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    app_name: str = os.getenv("APP_NAME", "Healthcare Claims API")
    app_version: str = os.getenv("APP_VERSION", "0.1.0")
    environment: str = os.getenv("ENVIRONMENT", "local")
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()
    # Comma-separated list of browser origins allowed to call the API (the React app).
    cors_allow_origins: list[str] = _split_csv(os.getenv("CORS_ALLOW_ORIGINS", DEFAULT_CORS_ALLOW_ORIGINS))
    aws_region: str = os.getenv("AWS_REGION", "ap-south-1")
    # Bucket for claim documents. No default: bucket names are global, so a guessed name could belong to
    # another AWS account. Credentials come from the standard AWS chain (profile, SSO, IAM role), never from here.
    s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "").strip()


settings = Settings()
