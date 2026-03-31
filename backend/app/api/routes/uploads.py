from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, UploadFile

from app.core.config import get_settings
from app.models.schemas import UploadedFileInfo


router = APIRouter()


def _resolve_extension(filename: str | None) -> str:
  if not filename:
    return ''
  return Path(filename).suffix


def _resolve_file_type(upload: UploadFile) -> str:
  content_type = upload.content_type or ''
  if content_type.startswith('image/'):
    return 'image'
  if 'pdf' in content_type:
    return 'pdf'
  if 'presentation' in content_type or 'powerpoint' in content_type:
    return 'presentation'
  if content_type.startswith('text/'):
    return 'text'
  return 'file'


@router.post('/uploads', response_model=UploadedFileInfo)
async def upload_file(
  file: UploadFile = File(...),
  category: str = Form('project'),
  description: str = Form(''),
) -> UploadedFileInfo:
  settings = get_settings()
  target_dir = settings.uploads_dir / category
  target_dir.mkdir(parents=True, exist_ok=True)

  extension = _resolve_extension(file.filename)
  safe_name = f'{uuid4().hex}{extension}'
  target_path = target_dir / safe_name
  content = await file.read()
  target_path.write_bytes(content)

  relative_path = target_path.relative_to(settings.storage_root).as_posix()
  created_at = datetime.utcnow()

  return UploadedFileInfo(
    file_name=file.filename or safe_name,
    file_path=relative_path,
    file_size=len(content),
    mime_type=file.content_type,
    file_type=_resolve_file_type(file),
    description=description or None,
    created_at=created_at,
  )
