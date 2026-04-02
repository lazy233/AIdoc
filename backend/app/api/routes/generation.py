from fastapi import APIRouter

from fastapi import HTTPException, status

from app.models.schemas import ProjectGenerationResponse, ReportGenerationRequest, ReportGenerationResponse
from app.services.project_generation_service import project_generation_service
from app.services.report_service import report_service


router = APIRouter(prefix='/generation')


@router.post('/tasks', response_model=ReportGenerationResponse)
def create_generation_task(payload: ReportGenerationRequest) -> ReportGenerationResponse:
    return report_service.create_report(payload)


@router.post('/projects/{project_id}', response_model=ProjectGenerationResponse)
def generate_project_ppt(project_id: str) -> ProjectGenerationResponse:
    try:
        return project_generation_service.generate(project_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
