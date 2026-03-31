from fastapi import APIRouter, HTTPException, Query, status

from app.models.schemas import DataManagementData, OperationStatus, StudentDetail, StudentListItem, StudentPayload
from app.services.postgres_repository import postgres_repository


router = APIRouter()


@router.get('/data', response_model=DataManagementData)
def get_data_management() -> DataManagementData:
  return postgres_repository.build_data_management_data()


@router.get('/students', response_model=list[StudentListItem])
def list_students(keyword: str | None = Query(default=None)) -> list[StudentListItem]:
  return postgres_repository.list_students(keyword)


@router.post('/students', response_model=StudentDetail, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentPayload) -> StudentDetail:
  return postgres_repository.create_student(payload)


@router.get('/students/{student_id}', response_model=StudentDetail)
def get_student(student_id: str) -> StudentDetail:
  student = postgres_repository.get_student(student_id)
  if not student:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Student not found')
  return student


@router.put('/students/{student_id}', response_model=StudentDetail)
def update_student(student_id: str, payload: StudentPayload) -> StudentDetail:
  student = postgres_repository.update_student(student_id, payload)
  if not student:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Student not found')
  return student


@router.delete('/students/{student_id}', response_model=OperationStatus)
def delete_student(student_id: str) -> OperationStatus:
  deleted = postgres_repository.delete_student(student_id)
  if not deleted:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Student not found')
  return OperationStatus(message='Student deleted')
