from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


def add_error_handlers(app: FastAPI):
    @app.exception_handler(SQLAlchemyError)
    async def database_error_handler(request: Request, exc: SQLAlchemyError):
        return JSONResponse(status_code=500, content={"detail": "Database error"})
