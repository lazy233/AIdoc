from fastapi import APIRouter, File, HTTPException, UploadFile, status

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
from app.core.config import get_settings
from app.services.ppt_template_ingest import _extract_embedded_cover_image, ingest_ppt_template
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


@router.post('/ppt-templates/upload', response_model=PptTemplateDetail, status_code=status.HTTP_201_CREATED)
async def upload_ppt_template(file: UploadFile = File(...)) -> PptTemplateDetail:
  suffix = (file.filename or '').lower()
  if not (suffix.endswith('.ppt') or suffix.endswith('.pptx')):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='仅支持上传 .ppt 或 .pptx 文件')

  content = await file.read()
  if not content:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='上传文件为空')

  return ingest_ppt_template(file.filename or 'template.pptx', content)


@router.get('/ppt-templates/{template_id}', response_model=PptTemplateDetail)
def get_ppt_template(template_id: str) -> PptTemplateDetail:
  template = postgres_repository.get_ppt_template(template_id)
  if not template:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='PPT template not found')
  storage_root = get_settings().storage_root
  needs_cover_refresh = False
  if template.source_file_path:
    if not template.cover_image_path:
      needs_cover_refresh = True
    else:
      cover_path = storage_root / template.cover_image_path
      needs_cover_refresh = not cover_path.exists()
  if needs_cover_refresh and template.source_file_path:
    source_path = get_settings().storage_root / template.source_file_path
    if source_path.exists():
      cover_image_path = _extract_embedded_cover_image(source_path)
      if cover_image_path:
        postgres_repository.update_ppt_template_cover(template_id, cover_image_path)
        refreshed = postgres_repository.get_ppt_template(template_id)
        if refreshed:
          return refreshed
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
