from pathlib import Path
from urllib.parse import urlparse

import psycopg


BASE_DIR = Path(__file__).resolve().parents[1]
SCHEMA_FILE = BASE_DIR / 'scripts' / 'schema.sql'


def load_database_url() -> str:
  env_path = BASE_DIR / '.env'
  if not env_path.exists():
    raise FileNotFoundError(f'Missing env file: {env_path}')

  for raw_line in env_path.read_text(encoding='utf-8').splitlines():
    line = raw_line.strip()
    if not line or line.startswith('#') or '=' not in line:
      continue

    key, value = line.split('=', 1)
    if key.strip() == 'DATABASE_URL':
      return value.strip()

  raise ValueError('DATABASE_URL is not set in backend/.env')


def ensure_database(database_url: str) -> str:
  parsed = urlparse(database_url)
  target_db = parsed.path.lstrip('/')
  admin_path = parsed.path.replace(f'/{target_db}', '/postgres', 1)
  admin_url = parsed._replace(path=admin_path).geturl()

  with psycopg.connect(admin_url, autocommit=True) as conn:
    with conn.cursor() as cursor:
      cursor.execute('SELECT 1 FROM pg_database WHERE datname = %s', (target_db,))
      exists = cursor.fetchone() is not None
      if not exists:
        cursor.execute(f'CREATE DATABASE "{target_db}"')

  return target_db


def apply_schema(database_url: str) -> None:
  schema_sql = SCHEMA_FILE.read_text(encoding='utf-8')
  with psycopg.connect(database_url, autocommit=True) as conn:
    with conn.cursor() as cursor:
      cursor.execute(schema_sql)


def main() -> None:
  database_url = load_database_url()
  target_db = ensure_database(database_url)
  apply_schema(database_url)
  print(f'Database ready: {target_db}')


if __name__ == '__main__':
  main()
