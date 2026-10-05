from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import add_error_handlers

app = FastAPI(
    title="ORDO API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

add_error_handlers(app)

app.include_router(health.router)
app.include_router(api_router)
