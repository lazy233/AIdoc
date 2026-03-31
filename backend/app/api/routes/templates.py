from fastapi import APIRouter, HTTPException, status

from app.models.schemas import (
  OperationStatus,
  PptTemplateDetail,
  PptTemplateListItem,
  PptTemplatePayload,
  ReportTemplateDetail,
  ReportTemplateListItem,
  ReportTemplatePayload,
  TemplateCenterData,
)
from app.services.postgres_repository import postgres_repository


router = APIRouter()


@router.get('/templates', response_model=TemplateCenterData)
def get_template_center() -> TemplateCenterData:
  return postgres_repository.build_template_center_data()


@router.get('/ppt-templates', response_model=list[PptTemplateListItem])
def list_ppt_templates() -> list[PptTemplateListItem]:
  return postgres_repository.list_ppt_templates()


@router.post('/ppt-templates', response_model=PptTemplateDetail, status_code=status.HTTP_201_CREATED)
def create_ppt_template(payload: PptTemplatePayload) -> PptTemplateDetail:
  return postgres_repository.create_ppt_template(payload)


@router.get('/ppt-templates/{template_id}', response_model=PptTemplateDetail)
def get_ppt_template(template_id: str) -> PptTemplateDetail:
  template = postgres_repository.get_ppt_template(template_id)
  if not template:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='PPT template not found')
  return template


@router.put('/ppt-templates/{template_id}', response_model=PptTemplateDetail)
def update_ppt_template(template_id: str, payload: PptTemplatePayload) -> PptTemplateDetail:
  template = postgres_repository.update_ppt_template(template_id, payload)
  if not template:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='PPT template not found')
  return template


@router.delete('/ppt-templates/{template_id}', response_model=OperationStatus)
def delete_ppt_template(template_id: str) -> OperationStatus:
  deleted = postgres_repository.delete_ppt_template(template_id)
  if not deleted:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='PPT template not found')
  return OperationStatus(message='PPT template deleted')


@router.get('/report-templates', response_model=list[ReportTemplateListItem])
def list_report_templates() -> list[ReportTemplateListItem]:
  return postgres_repository.list_report_templates()


@router.post('/report-templates', response_model=ReportTemplateDetail, status_code=status.HTTP_201_CREATED)
def create_report_template(payload: ReportTemplatePayload) -> ReportTemplateDetail:
  return postgres_repository.create_report_template(payload)


@router.get('/report-templates/{template_id}', response_model=ReportTemplateDetail)
def get_report_template(template_id: str) -> ReportTemplateDetail:
  template = postgres_repository.get_report_template(template_id)
  if not template:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report template not found')
  return template


@router.put('/report-templates/{template_id}', response_model=ReportTemplateDetail)
def update_report_template(template_id: str, payload: ReportTemplatePayload) -> ReportTemplateDetail:
  template = postgres_repository.update_report_template(template_id, payload)
  if not template:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report template not found')
  return template


@router.delete('/report-templates/{template_id}', response_model=OperationStatus)
def delete_report_template(template_id: str) -> OperationStatus:
  deleted = postgres_repository.delete_report_template(template_id)
  if not deleted:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Report template not found')
  return OperationStatus(message='Report template deleted')
