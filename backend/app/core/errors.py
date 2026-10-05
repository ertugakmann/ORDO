from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


class AppError(Exception):
    """An error with an HTTP status, raised by services."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


def add_error_handlers(app: FastAPI):
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(SQLAlchemyError)
    async def database_error_handler(request: Request, exc: SQLAlchemyError):
        return JSONResponse(status_code=500, content={"detail": "Database error"})
