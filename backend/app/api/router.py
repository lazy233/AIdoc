from fastapi import APIRouter

from app.api.routes import data, generation, history, templates, uploads, workbench


api_router = APIRouter()
api_router.include_router(workbench.router)
api_router.include_router(templates.router)
api_router.include_router(data.router)
api_router.include_router(history.router)
api_router.include_router(uploads.router)
api_router.include_router(generation.router)
