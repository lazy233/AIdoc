from fastapi import APIRouter

from app.models.schemas import ReportGenerationRequest, ReportGenerationResponse
from app.services.report_service import report_service


router = APIRouter(prefix='/generation')


@router.post('/tasks', response_model=ReportGenerationResponse)
def create_generation_task(payload: ReportGenerationRequest) -> ReportGenerationResponse:
    return report_service.create_report(payload)
