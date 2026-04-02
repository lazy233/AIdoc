from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  app_name: str = 'Graduation Report Studio API'
  api_prefix: str = '/api'
  storage_root: Path = Path(__file__).resolve().parents[2] / 'storage'
  cors_origins: list[str] = ['http://127.0.0.1:5173', 'http://localhost:5173']
  database_url: str = 'postgresql://postgres:123456@localhost:5432/graduation_report_studio'
  database_schema: str = 'public'
  dashscope_api_key: str | None = Field(
    default=None,
    validation_alias=AliasChoices('DASHSCOPE_API_KEY', 'OPENAI_API_KEY', 'OPENAIAPIKEY', 'openaiapikey'),
  )
  qwen_binding_model: str = Field(default='qwen-max', validation_alias='QWEN_BINDING_MODEL')

  model_config = SettingsConfigDict(
    env_file=Path(__file__).resolve().parents[2] / '.env',
    env_file_encoding='utf-8',
    extra='ignore',
    populate_by_name=True,
  )

  @property
  def generated_dir(self) -> Path:
    return self.storage_root / 'generated'

  @property
  def templates_dir(self) -> Path:
    return self.storage_root / 'templates'

  @property
  def uploads_dir(self) -> Path:
    return self.storage_root / 'uploads'

  def ensure_directories(self) -> None:
    self.generated_dir.mkdir(parents=True, exist_ok=True)
    self.templates_dir.mkdir(parents=True, exist_ok=True)
    self.uploads_dir.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
  return Settings()
