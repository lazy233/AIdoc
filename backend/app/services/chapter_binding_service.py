from __future__ import annotations

import json
import logging
import os
from typing import Any

import json5
import requests
from fastapi import HTTPException, status
from langchain_community.chat_models.tongyi import ChatTongyi
from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import get_settings
from app.models.schemas import (
  LlmBindingApplicationResult,
  ProjectBindingPayload,
  ProjectChatMessagePayload,
  ProjectPagePayload,
  project_detail_to_payload,
)
from app.services.postgres_repository import postgres_repository
from app.services.student_field_catalog import list_student_field_catalog

logger = logging.getLogger(__name__)

_SYSTEM = """你是一名教育行业报告排版助手。用户会提供：
1) 报告各章节的信息（标题、摘要等，来自报告模板，不含学生隐私内容）
2) 学生档案中「可选用」的数据字段清单：每条仅有字段 id、分组与中文说明，绝不包含任何具体取值

任务：为每一个章节（由 page_order 标识）挑选应挂载的数据字段 id。字段 id 必须逐字来自清单；同一字段可用于多个章节；某章节没有合适字段则 field_ids 为空数组。
禁止编造清单中不存在的 id。禁止输出字段的真实值或示例值。

只输出一个 JSON 对象，不要使用 Markdown 代码块，不要注释。格式严格如下：
{"assignments":[{"page_order":1,"field_ids":["field_id_1","field_id_2"]}]}
"""


def _read_windows_env_registry(*names: str) -> str | None:
  if os.name != 'nt':
    return None

  try:
    import winreg
  except ImportError:
    return None

  locations = (
    (winreg.HKEY_CURRENT_USER, r'Environment'),
    (winreg.HKEY_LOCAL_MACHINE, r'SYSTEM\CurrentControlSet\Control\Session Manager\Environment'),
  )
  wanted = {name.lower() for name in names}

  for root, path in locations:
    try:
      with winreg.OpenKey(root, path) as key:
        index = 0
        while True:
          try:
            name, value, _value_type = winreg.EnumValue(key, index)
          except OSError:
            break
          if name.lower() in wanted and str(value).strip():
            return str(value).strip()
          index += 1
    except OSError:
      continue

  return None


def _dashscope_api_key() -> str | None:
  settings = get_settings()
  for candidate in (
    settings.dashscope_api_key,
    os.environ.get('DASHSCOPE_API_KEY'),
    os.environ.get('OPENAI_API_KEY'),
    os.environ.get('OPENAIAPIKEY'),
    os.environ.get('openaiapikey'),
    _read_windows_env_registry('DASHSCOPE_API_KEY', 'OPENAI_API_KEY', 'OPENAIAPIKEY', 'openaiapikey'),
  ):
    if candidate and str(candidate).strip():
      return str(candidate).strip()
  return None


def _coerce_ai_content_to_text(content: Any) -> str:
  """通义等模型可能返回 str，或 LangChain 下的 list[dict]（含 text 段）。"""
  if content is None:
    return ''
  if isinstance(content, str):
    return content
  if isinstance(content, list):
    chunks: list[str] = []
    for part in content:
      if isinstance(part, str):
        chunks.append(part)
      elif isinstance(part, dict):
        t = part.get('text')
        if isinstance(t, str):
          chunks.append(t)
    return ''.join(chunks) if chunks else json.dumps(content, ensure_ascii=False)
  return str(content)


def _slice_first_brace_object(s: str, start: int) -> str | None:
  """从 start 处首个 `{` 起截取与其配对的闭合 `}`，忽略字符串内的括号。"""
  depth = 0
  in_string = False
  escape = False
  quote = ''
  i = start
  while i < len(s):
    c = s[i]
    if in_string:
      if escape:
        escape = False
      elif c == '\\':
        escape = True
      elif c == quote:
        in_string = False
        quote = ''
      i += 1
      continue
    if c in '"\'':
      in_string = True
      quote = c
      i += 1
      continue
    if c == '{':
      depth += 1
    elif c == '}':
      depth -= 1
      if depth == 0:
        return s[start : i + 1]
    i += 1
  return None


def _parse_assignments_json(text: str) -> dict[str, Any]:
  """解析模型输出：截取首个完整 `{...}`，用 json5 容错（尾随逗号、注释等）。"""
  raw = text.strip()
  if '</think>' in raw:
    raw = raw.split('</think>', maxsplit=1)[-1].strip()
  if raw.startswith('```'):
    raw = raw[3:].lstrip()
    if raw[:4].lower() == 'json':
      raw = raw[4:].lstrip()
    raw = raw.lstrip('\n\r')
    if raw.rstrip().endswith('```'):
      raw = raw.rstrip()[:-3].rstrip()
  start = raw.find('{')
  if start == -1:
    raise ValueError(f'模型未返回 JSON 对象，原文节选: {raw[:400]!r}')
  chunk = _slice_first_brace_object(raw, start)
  if chunk is None:
    raise ValueError(f'JSON 大括号未配对，原文节选: {raw[start : start + 400]!r}')
  try:
    obj = json5.loads(chunk)
  except Exception as exc:  # noqa: BLE001 — json5 可能抛出多种解析异常
    raise ValueError(f'模型 JSON 无法解析 ({exc})，原文节选: {chunk[:400]!r}') from exc
  if not isinstance(obj, dict):
    raise ValueError('JSON 根节点须为对象')
  return obj


def _invoke_llm(chapters: list[dict[str, Any]], fields: list[dict[str, str]], report_type: str, user_prompt: str | None) -> dict[str, Any]:
  key = _dashscope_api_key()
  if not key:
    raise HTTPException(
      status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
      detail='未配置可用的模型 API Key：请在环境中设置 DASHSCOPE_API_KEY（百炼/DashScope），或暂用 OPENAI_API_KEY 填入同一密钥。',
    )

  settings = get_settings()
  llm = ChatTongyi(
    model=settings.qwen_binding_model,
    api_key=key,
    temperature=0.2,
  )
  payload = {
    'report_type': report_type,
    'user_generation_prompt': user_prompt or '',
    'chapters': chapters,
    'student_data_field_catalog': fields,
  }
  messages = [
    SystemMessage(content=_SYSTEM),
    HumanMessage(content=json.dumps(payload, ensure_ascii=False)),
  ]
  result = llm.invoke(messages)
  content = _coerce_ai_content_to_text(getattr(result, 'content', result))
  if not content.strip():
    raise ValueError('模型返回内容为空')
  try:
    return _parse_assignments_json(content)
  except ValueError:
    logger.warning('解析模型 JSON 失败，原文前 1800 字: %s', content[:1800])
    raise


def _normalize_page_order(value: Any) -> int | None:
  if isinstance(value, bool):
    return None
  if isinstance(value, int):
    return value
  if isinstance(value, float):
    return int(value)
  if isinstance(value, str) and value.strip().isdigit():
    return int(value.strip())
  return None


def apply_llm_chapter_bindings(project_id: str) -> LlmBindingApplicationResult:
  detail = postgres_repository.get_project(project_id)
  if not detail:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')

  if not detail.student_id:
    return LlmBindingApplicationResult(
      project=detail,
      applied=False,
      skipped_reason='未选择学生，已保留根据模板生成的章节数据挂载。',
    )

  fields = list_student_field_catalog()
  allowed_ids = {entry['id'] for entry in fields}

  chapters = [
    {
      'page_order': p.page_order,
      'title': p.title,
      'description': p.description,
      'slide_hint': p.slide_hint,
    }
    for p in sorted(detail.pages, key=lambda x: x.page_order)
  ]

  try:
    raw = _invoke_llm(chapters, fields, detail.report_type, detail.prompt)
  except HTTPException:
    raise
  except requests.exceptions.HTTPError as exc:
    body = ''
    if exc.response is not None:
      try:
        body = (exc.response.text or '')[:800]
      except Exception:  # noqa: BLE001
        body = ''
    logger.exception('DashScope HTTP 错误')
    raise HTTPException(
      status_code=status.HTTP_502_BAD_GATEWAY,
      detail=f'大模型网关 HTTP 错误 ({exc})。响应节选: {body or "无"}',
    ) from exc
  except Exception as exc:  # noqa: BLE001
    logger.exception('DashScope / LangChain 调用失败')
    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f'大模型调用失败: {exc}') from exc

  assignments = raw.get('assignments')
  if not isinstance(assignments, list):
    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='大模型返回格式无效：缺少 assignments 数组')

  by_order: dict[int, list[str]] = {}
  for item in assignments:
    if not isinstance(item, dict):
      continue
    po = _normalize_page_order(item.get('page_order'))
    if po is None:
      continue
    fids = item.get('field_ids')
    if not isinstance(fids, list):
      continue
    cleaned: list[str] = []
    for fid in fids:
      if isinstance(fid, str) and fid in allowed_ids and fid not in cleaned:
        cleaned.append(fid)
    by_order[po] = cleaned

  base = project_detail_to_payload(detail)
  new_pages: list[ProjectPagePayload] = []
  for page in base.pages:
    chosen = by_order.get(page.page_order, [])
    bindings = [
      ProjectBindingPayload(
        id=None,
        binding_group='章节数据',
        field_name=fid,
        field_order=idx + 1,
      )
      for idx, fid in enumerate(chosen)
    ]
    new_pages.append(page.model_copy(update={'bindings': bindings}))

  followup = ProjectChatMessagePayload(
    id=None,
    role='assistant',
    content='已根据报告模板章节与学生数据「字段清单」（未使用任何具体取值），由大模型完成各章节数据字段挂载。',
  )
  payload = base.model_copy(
    update={
      'pages': new_pages,
      'messages': [*base.messages, followup],
    },
  )

  updated = postgres_repository.update_project(project_id, payload)
  if not updated:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Project not found')

  return LlmBindingApplicationResult(project=updated, applied=True, skipped_reason=None)
