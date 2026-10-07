import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import claims, health
from app.config import settings

logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(health.router)
app.include_router(claims.router)
