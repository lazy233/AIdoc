from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    settings.ensure_directories()

    application = FastAPI(
        title=settings.app_name,
        version='0.1.0',
        summary='AI-assisted academic graduation report backend',
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    @application.get('/health')
    def health() -> dict[str, str]:
        return {
            'status': 'ok',
            'service': settings.app_name,
            'generatedDir': str(settings.generated_dir),
        }

    application.include_router(api_router, prefix=settings.api_prefix)
    return application


app = create_app()
