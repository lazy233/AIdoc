from fastapi import APIRouter, HTTPException, status

from app.models.schemas import OperationStatus, ProjectDetail, ProjectListItem, ProjectPayload, WorkbenchData
from app.services.postgres_repository import postgres_repository


router = APIRouter()


@router.get('/workbench', response_model=WorkbenchData)
def get_workbench_data() -> WorkbenchData:
  return postgres_repository.build_workbench_data()


@router.get('/projects', response_model=list[ProjectListItem])
def list_projects() -> list[ProjectListItem]:
  return postgres_repository.list_projects()


@router.post('/projects', response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectPayload) -> ProjectDetail:
  return postgres_repository.create_project(payload)


@router.get('/projects/{project_id}', response_model=ProjectDetail)
def get_project(project_id: str) -> ProjectDetail:
  project = postgres_repository.get_project(project_id)
  if not project:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
  return project


@router.put('/projects/{project_id}', response_model=ProjectDetail)
def update_project(project_id: str, payload: ProjectPayload) -> ProjectDetail:
  project = postgres_repository.update_project(project_id, payload)
  if not project:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
  return project


@router.delete('/projects/{project_id}', response_model=OperationStatus)
def delete_project(project_id: str) -> OperationStatus:
  deleted = postgres_repository.delete_project(project_id)
  if not deleted:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')
  return OperationStatus(message='Project deleted')
