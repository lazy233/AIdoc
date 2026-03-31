from fastapi import APIRouter, HTTPException, status

from app.models.schemas import (
  GenerationHistoryDetail,
  GenerationHistoryListItem,
  GenerationHistoryPayload,
  HistoryData,
  OperationStatus,
)
from app.services.postgres_repository import postgres_repository


router = APIRouter()


@router.get('/history', response_model=HistoryData)
def get_history() -> HistoryData:
  return postgres_repository.build_history_data()


@router.get('/histories', response_model=list[GenerationHistoryListItem])
def list_histories() -> list[GenerationHistoryListItem]:
  return postgres_repository.list_histories()


@router.post('/histories', response_model=GenerationHistoryDetail, status_code=status.HTTP_201_CREATED)
def create_history(payload: GenerationHistoryPayload) -> GenerationHistoryDetail:
  return postgres_repository.create_history_entry(payload)


@router.get('/histories/{history_id}', response_model=GenerationHistoryDetail)
def get_history_entry(history_id: str) -> GenerationHistoryDetail:
  history = postgres_repository.get_history_entry(history_id)
  if not history:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='History entry not found')
  return history


@router.put('/histories/{history_id}', response_model=GenerationHistoryDetail)
def update_history(history_id: str, payload: GenerationHistoryPayload) -> GenerationHistoryDetail:
  history = postgres_repository.update_history_entry(history_id, payload)
  if not history:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='History entry not found')
  return history


@router.delete('/histories/{history_id}', response_model=OperationStatus)
def delete_history(history_id: str) -> OperationStatus:
  deleted = postgres_repository.delete_history_entry(history_id)
  if not deleted:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='History entry not found')
  return OperationStatus(message='History entry deleted')
