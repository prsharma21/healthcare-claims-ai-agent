import os


class Settings:
    app_name: str = os.getenv("APP_NAME", "Healthcare Claims API")
    app_version: str = os.getenv("APP_VERSION", "0.1.0")
    environment: str = os.getenv("ENVIRONMENT", "local")


settings = Settings()
