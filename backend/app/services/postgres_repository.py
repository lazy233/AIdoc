from datetime import datetime
from itertools import cycle
from typing import Any
from uuid import UUID

from psycopg.types.json import Jsonb

from app.core.db import get_connection
from app.models.schemas import (
  DataManagementData,
  DataSource,
  GenerationMode,
  HistoryData,
  HistoryRecord,
  Metric,
  ModuleItem,
  OutlineBlock,
  PptTemplateDetail,
  PptTemplateListItem,
  PptTemplatePayload,
  ProjectDetail,
  ProjectListItem,
  ProjectPayload,
  QueueItem,
  ReportTemplateDetail,
  ReportTemplateListItem,
  ReportTemplatePayload,
  ReportTemplateSectionDetail,
  ReportTemplateSectionSummary,
  ReportTemplateSummary,
  StudentDetail,
  StudentFilePayload,
  StudentListItem,
  StudentPayload,
  StudentRecord,
  TemplateCenterData,
  TemplateItem,
  WorkbenchData,
)


TEMPLATE_COLORS = [
  ('#153b5c', '#ff9857'),
  ('#124e78', '#4ad1c8'),
  ('#513252', '#f39f5a'),
  ('#0d7c66', '#f4c95d'),
  ('#1d3557', '#72b01d'),
  ('#481d24', '#ff7b54'),
]

_ACCENTS = cycle(['ink', 'emerald', 'amber', 'azure'])


def _as_datetime_text(value: datetime | None) -> str:
  return value.strftime('%Y-%m-%d %H:%M') if value else ''


def _valid_uuid(value: str | None) -> str | None:
  if not value:
    return None

  try:
    return str(UUID(str(value)))
  except (ValueError, TypeError):
    return None


def _stringify_fields(row: dict[str, Any], *keys: str) -> dict[str, Any]:
  data = dict(row)
  for key in keys:
    if data.get(key) is not None:
      data[key] = str(data[key])
  return data


class PostgresRepository:
  def _fetchone(self, query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    with get_connection() as conn:
      with conn.cursor() as cursor:
        cursor.execute(query, params)
        return cursor.fetchone()

  def _fetchall(self, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with get_connection() as conn:
      with conn.cursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return rows or []

  def _build_template_item(self, row: dict[str, Any], index: int, usage_count: int = 0) -> TemplateItem:
    color_a, color_b = TEMPLATE_COLORS[index % len(TEMPLATE_COLORS)]
    tags = [item for item in [row.get('category'), row.get('theme_name'), row.get('aspect_ratio')] if item]
    return TemplateItem(
      id=str(row['id']),
      title=row['name'],
      description=row.get('theme_name') or row.get('parse_error') or '',
      category=row.get('category') or '未分类',
      tags=tags[:3],
      slides=row.get('page_count') or 0,
      usageCount=usage_count,
      colorA=color_a,
      colorB=color_b,
      premium=False,
    )

  def _fetch_student_detail_in_conn(self, conn, student_id: str) -> StudentDetail | None:
    with conn.cursor() as cursor:
      cursor.execute('SELECT * FROM students WHERE id = %s', (student_id,))
      student_row = cursor.fetchone()
      if not student_row:
        return None

      cursor.execute('SELECT * FROM student_learning_profiles WHERE student_id = %s', (student_id,))
      learning_profile = cursor.fetchone() or {}
      cursor.execute('SELECT * FROM student_lesson_data WHERE student_id = %s', (student_id,))
      lesson_data = cursor.fetchone() or {}
      cursor.execute('SELECT * FROM student_ai_copies WHERE student_id = %s', (student_id,))
      ai_copy = cursor.fetchone() or {}
      cursor.execute('SELECT * FROM student_files WHERE student_id = %s ORDER BY created_at DESC', (student_id,))
      files = cursor.fetchall() or []

      return StudentDetail(
        id=str(student_row['id']),
        student_no=student_row.get('student_no'),
        name=student_row['name'],
        nickname=student_row.get('nickname'),
        institution=student_row.get('institution'),
        major=student_row.get('major'),
        grade=student_row.get('grade'),
        current_semester=student_row.get('current_semester'),
        report_subtitle=student_row.get('report_subtitle'),
        service_start_date=student_row.get('service_start_date'),
        advisor_name=student_row.get('advisor_name'),
        report_title=student_row.get('report_title'),
        status=student_row.get('status') or 'draft',
        learning_profile=learning_profile,
        lesson_data=lesson_data,
        ai_copy=ai_copy,
        files=[StudentFilePayload(**{**item, 'id': str(item['id'])}) for item in files],
        created_at=student_row['created_at'],
        updated_at=student_row['updated_at'],
      )

  def list_students(self, keyword: str | None = None) -> list[StudentListItem]:
    like = f'%{keyword.strip()}%' if keyword and keyword.strip() else None
    if like is None:
      rows = self._fetchall(
        '''
        SELECT
          s.*,
          COUNT(sf.id) AS file_count
        FROM students s
        LEFT JOIN student_files sf ON sf.student_id = s.id
        GROUP BY s.id
        ORDER BY s.updated_at DESC, s.created_at DESC
        '''
      )
    else:
      rows = self._fetchall(
        '''
        SELECT
          s.*,
          COUNT(sf.id) AS file_count
        FROM students s
        LEFT JOIN student_files sf ON sf.student_id = s.id
        WHERE (
          s.name ILIKE %s
          OR COALESCE(s.institution, '') ILIKE %s
          OR COALESCE(s.major, '') ILIKE %s
          OR COALESCE(s.grade, '') ILIKE %s
          OR COALESCE(s.current_semester, '') ILIKE %s
          OR COALESCE(s.advisor_name, '') ILIKE %s
        )
        GROUP BY s.id
        ORDER BY s.updated_at DESC, s.created_at DESC
        ''',
        (like, like, like, like, like, like),
      )
    return [
      StudentListItem(
        id=str(row['id']),
        student_no=row.get('student_no'),
        name=row['name'],
        nickname=row.get('nickname'),
        institution=row.get('institution'),
        major=row.get('major'),
        grade=row.get('grade'),
        current_semester=row.get('current_semester'),
        advisor_name=row.get('advisor_name'),
        status=row.get('status') or 'draft',
        file_count=int(row.get('file_count') or 0),
        updated_at=row['updated_at'],
      )
      for row in rows
    ]

  def get_student(self, student_id: str) -> StudentDetail | None:
    with get_connection() as conn:
      return self._fetch_student_detail_in_conn(conn, student_id)

  def _save_student_children(self, conn, student_id: str, payload: StudentPayload) -> None:
    with conn.cursor() as cursor:
      cursor.execute(
        '''
        INSERT INTO student_learning_profiles (
          student_id, strength_subjects, international_score, study_intent, career_intent,
          interest_subjects, long_term_plan, learning_style, weakness
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (student_id) DO UPDATE SET
          strength_subjects = EXCLUDED.strength_subjects,
          international_score = EXCLUDED.international_score,
          study_intent = EXCLUDED.study_intent,
          career_intent = EXCLUDED.career_intent,
          interest_subjects = EXCLUDED.interest_subjects,
          long_term_plan = EXCLUDED.long_term_plan,
          learning_style = EXCLUDED.learning_style,
          weakness = EXCLUDED.weakness
        ''',
        (
          student_id,
          payload.learning_profile.strength_subjects,
          payload.learning_profile.international_score,
          payload.learning_profile.study_intent,
          payload.learning_profile.career_intent,
          payload.learning_profile.interest_subjects,
          payload.learning_profile.long_term_plan,
          payload.learning_profile.learning_style,
          payload.learning_profile.weakness,
        ),
      )
      cursor.execute(
        '''
        INSERT INTO student_lesson_data (
          student_id, total_hours, used_hours, remaining_hours, tutoring_subjects,
          preview_subjects, skill_focus, skill_description
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (student_id) DO UPDATE SET
          total_hours = EXCLUDED.total_hours,
          used_hours = EXCLUDED.used_hours,
          remaining_hours = EXCLUDED.remaining_hours,
          tutoring_subjects = EXCLUDED.tutoring_subjects,
          preview_subjects = EXCLUDED.preview_subjects,
          skill_focus = EXCLUDED.skill_focus,
          skill_description = EXCLUDED.skill_description
        ''',
        (
          student_id,
          payload.lesson_data.total_hours,
          payload.lesson_data.used_hours,
          payload.lesson_data.remaining_hours,
          payload.lesson_data.tutoring_subjects,
          payload.lesson_data.preview_subjects,
          payload.lesson_data.skill_focus,
          payload.lesson_data.skill_description,
        ),
      )
      cursor.execute(
        '''
        INSERT INTO student_ai_copies (
          student_id, term_overview, course_feedback, short_term_advice, long_term_roadmap
        ) VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (student_id) DO UPDATE SET
          term_overview = EXCLUDED.term_overview,
          course_feedback = EXCLUDED.course_feedback,
          short_term_advice = EXCLUDED.short_term_advice,
          long_term_roadmap = EXCLUDED.long_term_roadmap
        ''',
        (
          student_id,
          payload.ai_copy.term_overview,
          payload.ai_copy.course_feedback,
          payload.ai_copy.short_term_advice,
          payload.ai_copy.long_term_roadmap,
        ),
      )
      cursor.execute('DELETE FROM student_files WHERE student_id = %s', (student_id,))
      for item in payload.files:
        file_id = _valid_uuid(item.id)
        if file_id:
          cursor.execute(
            '''
            INSERT INTO student_files (
              id, student_id, file_name, file_type, mime_type, file_path, file_size, description, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, COALESCE(%s, NOW()))
            ''',
            (
              file_id,
              student_id,
              item.file_name,
              item.file_type,
              item.mime_type,
              item.file_path,
              item.file_size,
              item.description,
              item.created_at,
            ),
          )
        else:
          cursor.execute(
            '''
            INSERT INTO student_files (
              student_id, file_name, file_type, mime_type, file_path, file_size, description, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, COALESCE(%s, NOW()))
            ''',
            (
              student_id,
              item.file_name,
              item.file_type,
              item.mime_type,
              item.file_path,
              item.file_size,
              item.description,
              item.created_at,
            ),
          )

  def create_student(self, payload: StudentPayload) -> StudentDetail:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          INSERT INTO students (
            student_no, name, nickname, institution, major, grade, current_semester,
            report_subtitle, service_start_date, advisor_name, report_title, status
          ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
          RETURNING id
          ''',
          (
            payload.student_no,
            payload.name,
            payload.nickname,
            payload.institution,
            payload.major,
            payload.grade,
            payload.current_semester,
            payload.report_subtitle,
            payload.service_start_date,
            payload.advisor_name,
            payload.report_title,
            payload.status,
          ),
        )
        student_id = str(cursor.fetchone()['id'])
        self._save_student_children(conn, student_id, payload)
      return self._fetch_student_detail_in_conn(conn, student_id)  # type: ignore[return-value]

  def update_student(self, student_id: str, payload: StudentPayload) -> StudentDetail | None:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          UPDATE students
          SET
            student_no = %s,
            name = %s,
            nickname = %s,
            institution = %s,
            major = %s,
            grade = %s,
            current_semester = %s,
            report_subtitle = %s,
            service_start_date = %s,
            advisor_name = %s,
            report_title = %s,
            status = %s
          WHERE id = %s
          RETURNING id
          ''',
          (
            payload.student_no,
            payload.name,
            payload.nickname,
            payload.institution,
            payload.major,
            payload.grade,
            payload.current_semester,
            payload.report_subtitle,
            payload.service_start_date,
            payload.advisor_name,
            payload.report_title,
            payload.status,
            student_id,
          ),
        )
        if not cursor.fetchone():
          return None
        self._save_student_children(conn, student_id, payload)
      return self._fetch_student_detail_in_conn(conn, student_id)

  def delete_student(self, student_id: str) -> bool:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute('DELETE FROM students WHERE id = %s', (student_id,))
        return cursor.rowcount > 0

  def list_ppt_templates(self) -> list[PptTemplateListItem]:
    rows = self._fetchall(
      '''
      SELECT id, name, category, status, source_file_name, page_count, parse_status, parsed_at, updated_at
      FROM ppt_templates
      ORDER BY updated_at DESC, created_at DESC
      '''
    )
    return [PptTemplateListItem(**{**row, 'id': str(row['id'])}) for row in rows]

  def _fetch_ppt_template_detail_in_conn(self, conn, template_id: str) -> PptTemplateDetail | None:
    from app.models.schemas import PptTemplateComponentDetail, PptTemplatePageDetail, PptTemplateSectionDetail

    with conn.cursor() as cursor:
      cursor.execute('SELECT * FROM ppt_templates WHERE id = %s', (template_id,))
      template_row = cursor.fetchone()
      if not template_row:
        return None

      cursor.execute(
        'SELECT * FROM ppt_template_sections WHERE ppt_template_id = %s ORDER BY section_order',
        (template_id,),
      )
      section_rows = cursor.fetchall() or []

      cursor.execute(
        'SELECT * FROM ppt_template_pages WHERE ppt_template_id = %s ORDER BY page_no',
        (template_id,),
      )
      page_rows = cursor.fetchall() or []
      page_ids = [row['id'] for row in page_rows]
      components_by_page: dict[str, list[PptTemplateComponentDetail]] = {}
      if page_ids:
        cursor.execute(
          'SELECT * FROM ppt_template_components WHERE page_id = ANY(%s::uuid[]) ORDER BY component_order',
          (page_ids,),
        )
        for component in cursor.fetchall() or []:
          page_key = str(component['page_id'])
          components_by_page.setdefault(page_key, []).append(
            PptTemplateComponentDetail(**{**component, 'id': str(component['id']), 'page_id': page_key})
          )

      sections = [PptTemplateSectionDetail(**{**row, 'id': str(row['id'])}) for row in section_rows]
      reverse_section_map = {str(row['id']): row['section_order'] for row in section_rows}
      pages = [
        PptTemplatePageDetail(
          **{
            **row,
            'id': str(row['id']),
            'section_id': str(row['section_id']) if row.get('section_id') else None,
            'section_order': reverse_section_map.get(str(row['section_id'])) if row.get('section_id') else None,
            'components': components_by_page.get(str(row['id']), []),
          }
        )
        for row in page_rows
      ]

      return PptTemplateDetail(
        id=str(template_row['id']),
        name=template_row['name'],
        category=template_row.get('category'),
        status=template_row.get('status') or 'draft',
        source_file_name=template_row.get('source_file_name'),
        source_file_path=template_row['source_file_path'],
        cover_image_path=template_row.get('cover_image_path'),
        file_size=template_row.get('file_size'),
        page_count=template_row.get('page_count') or 0,
        aspect_ratio=template_row.get('aspect_ratio'),
        theme_name=template_row.get('theme_name'),
        template_version=template_row.get('template_version'),
        parse_status=template_row.get('parse_status') or 'pending',
        parse_error=template_row.get('parse_error'),
        outline_json=template_row.get('outline_json') or [],
        pages_json=template_row.get('pages_json') or [],
        components_json=template_row.get('components_json') or [],
        style_tokens_json=template_row.get('style_tokens_json') or {},
        slot_bindings_json=template_row.get('slot_bindings_json') or {},
        parsed_at=template_row.get('parsed_at'),
        sections=sections,
        pages=pages,
        created_at=template_row['created_at'],
        updated_at=template_row['updated_at'],
      )

  def get_ppt_template(self, template_id: str) -> PptTemplateDetail | None:
    with get_connection() as conn:
      return self._fetch_ppt_template_detail_in_conn(conn, template_id)

  def _replace_ppt_template_nested(self, conn, template_id: str, payload: PptTemplatePayload) -> None:
    with conn.cursor() as cursor:
      cursor.execute('DELETE FROM ppt_template_components WHERE ppt_template_id = %s', (template_id,))
      cursor.execute('DELETE FROM ppt_template_pages WHERE ppt_template_id = %s', (template_id,))
      cursor.execute('DELETE FROM ppt_template_sections WHERE ppt_template_id = %s', (template_id,))

      section_id_map: dict[int, str] = {}
      for section in payload.sections:
        section_id = _valid_uuid(section.id)
        if section_id:
          cursor.execute(
            '''
            INSERT INTO ppt_template_sections (
              id, ppt_template_id, section_order, section_title, start_page_no, end_page_no, page_count, summary
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            ''',
            (
              section_id,
              template_id,
              section.section_order,
              section.section_title,
              section.start_page_no,
              section.end_page_no,
              section.page_count,
              section.summary,
            ),
          )
        else:
          cursor.execute(
            '''
            INSERT INTO ppt_template_sections (
              ppt_template_id, section_order, section_title, start_page_no, end_page_no, page_count, summary
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            ''',
            (
              template_id,
              section.section_order,
              section.section_title,
              section.start_page_no,
              section.end_page_no,
              section.page_count,
              section.summary,
            ),
          )
        section_id_map[section.section_order] = str(cursor.fetchone()['id'])

      for page in payload.pages:
        section_id = section_id_map.get(page.section_order) if page.section_order is not None else None
        page_id = _valid_uuid(page.id)
        if page_id:
          cursor.execute(
            '''
            INSERT INTO ppt_template_pages (
              id, ppt_template_id, section_id, page_no, page_title, page_type, layout_name, notes,
              component_count, snapshot_path, raw_page_json
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            ''',
            (
              page_id,
              template_id,
              section_id,
              page.page_no,
              page.page_title,
              page.page_type,
              page.layout_name,
              page.notes,
              len(page.components) if page.components else page.component_count,
              page.snapshot_path,
              Jsonb(page.raw_page_json),
            ),
          )
        else:
          cursor.execute(
            '''
            INSERT INTO ppt_template_pages (
              ppt_template_id, section_id, page_no, page_title, page_type, layout_name, notes,
              component_count, snapshot_path, raw_page_json
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            ''',
            (
              template_id,
              section_id,
              page.page_no,
              page.page_title,
              page.page_type,
              page.layout_name,
              page.notes,
              len(page.components) if page.components else page.component_count,
              page.snapshot_path,
              Jsonb(page.raw_page_json),
            ),
          )
        created_page_id = str(cursor.fetchone()['id'])
        for component in page.components:
          component_id = _valid_uuid(component.id)
          params = (
            component_id,
            template_id,
            created_page_id,
            component.component_order,
            component.component_type,
            component.component_name,
            component.placeholder_key,
            component.text_content,
            component.x,
            component.y,
            component.width,
            component.height,
            component.z_index,
            Jsonb(component.style_json),
            component.binding_hint,
            Jsonb(component.raw_component_json),
          )
          if component_id:
            cursor.execute(
              '''
              INSERT INTO ppt_template_components (
                id, ppt_template_id, page_id, component_order, component_type, component_name, placeholder_key,
                text_content, x, y, width, height, z_index, style_json, binding_hint, raw_component_json
              ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
              ''',
              params,
            )
          else:
            cursor.execute(
              '''
              INSERT INTO ppt_template_components (
                ppt_template_id, page_id, component_order, component_type, component_name, placeholder_key,
                text_content, x, y, width, height, z_index, style_json, binding_hint, raw_component_json
              ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
              ''',
              params[1:],
            )

  def create_ppt_template(self, payload: PptTemplatePayload) -> PptTemplateDetail:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          INSERT INTO ppt_templates (
            name, category, status, source_file_name, source_file_path, cover_image_path, file_size, page_count,
            aspect_ratio, theme_name, template_version, parse_status, parse_error, outline_json, pages_json,
            components_json, style_tokens_json, slot_bindings_json, parsed_at
          ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
          RETURNING id
          ''',
          (
            payload.name,
            payload.category,
            payload.status,
            payload.source_file_name,
            payload.source_file_path,
            payload.cover_image_path,
            payload.file_size,
            payload.page_count,
            payload.aspect_ratio,
            payload.theme_name,
            payload.template_version,
            payload.parse_status,
            payload.parse_error,
            Jsonb(payload.outline_json),
            Jsonb(payload.pages_json),
            Jsonb(payload.components_json),
            Jsonb(payload.style_tokens_json),
            Jsonb(payload.slot_bindings_json),
            payload.parsed_at,
          ),
        )
        template_id = str(cursor.fetchone()['id'])
        self._replace_ppt_template_nested(conn, template_id, payload)
      return self._fetch_ppt_template_detail_in_conn(conn, template_id)  # type: ignore[return-value]

  def update_ppt_template(self, template_id: str, payload: PptTemplatePayload) -> PptTemplateDetail | None:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          UPDATE ppt_templates
          SET
            name = %s,
            category = %s,
            status = %s,
            source_file_name = %s,
            source_file_path = %s,
            cover_image_path = %s,
            file_size = %s,
            page_count = %s,
            aspect_ratio = %s,
            theme_name = %s,
            template_version = %s,
            parse_status = %s,
            parse_error = %s,
            outline_json = %s,
            pages_json = %s,
            components_json = %s,
            style_tokens_json = %s,
            slot_bindings_json = %s,
            parsed_at = %s
          WHERE id = %s
          RETURNING id
          ''',
          (
            payload.name,
            payload.category,
            payload.status,
            payload.source_file_name,
            payload.source_file_path,
            payload.cover_image_path,
            payload.file_size,
            payload.page_count,
            payload.aspect_ratio,
            payload.theme_name,
            payload.template_version,
            payload.parse_status,
            payload.parse_error,
            Jsonb(payload.outline_json),
            Jsonb(payload.pages_json),
            Jsonb(payload.components_json),
            Jsonb(payload.style_tokens_json),
            Jsonb(payload.slot_bindings_json),
            payload.parsed_at,
            template_id,
          ),
        )
        if not cursor.fetchone():
          return None
        self._replace_ppt_template_nested(conn, template_id, payload)
      return self._fetch_ppt_template_detail_in_conn(conn, template_id)

  def delete_ppt_template(self, template_id: str) -> bool:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute('DELETE FROM ppt_templates WHERE id = %s', (template_id,))
        return cursor.rowcount > 0

  def list_report_templates(self) -> list[ReportTemplateListItem]:
    rows = self._fetchall(
      '''
      SELECT
        rt.*,
        COUNT(rts.id) AS section_count
      FROM report_templates rt
      LEFT JOIN report_template_sections rts ON rts.report_template_id = rt.id
      GROUP BY rt.id
      ORDER BY rt.updated_at DESC, rt.created_at DESC
      '''
    )
    return [ReportTemplateListItem(**{**row, 'id': str(row['id'])}) for row in rows]

  def _fetch_report_template_detail_in_conn(self, conn, template_id: str) -> ReportTemplateDetail | None:
    with conn.cursor() as cursor:
      cursor.execute('SELECT * FROM report_templates WHERE id = %s', (template_id,))
      template_row = cursor.fetchone()
      if not template_row:
        return None

      cursor.execute(
        'SELECT * FROM report_template_sections WHERE report_template_id = %s ORDER BY section_order',
        (template_id,),
      )
      sections = [
        ReportTemplateSectionDetail(**{**row, 'id': str(row['id'])})
        for row in (cursor.fetchall() or [])
      ]

      return ReportTemplateDetail(
        id=str(template_row['id']),
        name=template_row['name'],
        report_type=template_row['report_type'],
        status=template_row['status'],
        sections=sections,
        created_at=template_row['created_at'],
        updated_at=template_row['updated_at'],
      )

  def get_report_template(self, template_id: str) -> ReportTemplateDetail | None:
    with get_connection() as conn:
      return self._fetch_report_template_detail_in_conn(conn, template_id)

  def _replace_report_template_sections(self, conn, template_id: str, sections: list[Any]) -> None:
    with conn.cursor() as cursor:
      cursor.execute('DELETE FROM report_template_sections WHERE report_template_id = %s', (template_id,))
      for section in sections:
        section_id = _valid_uuid(section.id)
        params = (
          section_id,
          template_id,
          section.section_order,
          section.title,
          section.summary,
          Jsonb(section.content_points),
          Jsonb(section.data_bindings),
          section.recommended_pages,
        )
        if section_id:
          cursor.execute(
            '''
            INSERT INTO report_template_sections (
              id, report_template_id, section_order, title, summary, content_points, data_bindings, recommended_pages
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''',
            params,
          )
        else:
          cursor.execute(
            '''
            INSERT INTO report_template_sections (
              report_template_id, section_order, title, summary, content_points, data_bindings, recommended_pages
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''',
            params[1:],
          )

  def create_report_template(self, payload: ReportTemplatePayload) -> ReportTemplateDetail:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          INSERT INTO report_templates (name, report_type, status)
          VALUES (%s, %s, %s)
          RETURNING id
          ''',
          (payload.name, payload.report_type, payload.status),
        )
        template_id = str(cursor.fetchone()['id'])
        self._replace_report_template_sections(conn, template_id, payload.sections)
      return self._fetch_report_template_detail_in_conn(conn, template_id)  # type: ignore[return-value]

  def update_report_template(self, template_id: str, payload: ReportTemplatePayload) -> ReportTemplateDetail | None:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          UPDATE report_templates
          SET name = %s, report_type = %s, status = %s
          WHERE id = %s
          RETURNING id
          ''',
          (payload.name, payload.report_type, payload.status, template_id),
        )
        if not cursor.fetchone():
          return None
        self._replace_report_template_sections(conn, template_id, payload.sections)
      return self._fetch_report_template_detail_in_conn(conn, template_id)

  def delete_report_template(self, template_id: str) -> bool:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute('DELETE FROM report_templates WHERE id = %s', (template_id,))
        return cursor.rowcount > 0

  def list_projects(self) -> list[ProjectListItem]:
    rows = self._fetchall(
      '''
      SELECT
        rp.*,
        COUNT(rpp.id) AS page_count
      FROM report_projects rp
      LEFT JOIN report_project_pages rpp ON rpp.project_id = rp.id
      GROUP BY rp.id
      ORDER BY rp.updated_at DESC, rp.created_at DESC
      '''
    )
    return [
      ProjectListItem(**_stringify_fields(row, 'id', 'student_id', 'report_template_id', 'ppt_template_id'))
      for row in rows
    ]

  def _fetch_project_detail_in_conn(self, conn, project_id: str) -> ProjectDetail | None:
    from app.models.schemas import ProjectBindingDetail, ProjectChatMessageDetail, ProjectFileDetail, ProjectPageDetail

    with conn.cursor() as cursor:
      cursor.execute('SELECT * FROM report_projects WHERE id = %s', (project_id,))
      project_row = cursor.fetchone()
      if not project_row:
        return None

      cursor.execute(
        'SELECT * FROM report_project_pages WHERE project_id = %s ORDER BY page_order',
        (project_id,),
      )
      page_rows = cursor.fetchall() or []
      page_ids = [row['id'] for row in page_rows]
      bindings_by_page: dict[str, list[ProjectBindingDetail]] = {}
      files_by_page: dict[str, list[ProjectFileDetail]] = {}

      if page_ids:
        cursor.execute(
          'SELECT * FROM report_project_page_bindings WHERE project_page_id = ANY(%s::uuid[]) ORDER BY field_order',
          (page_ids,),
        )
        for row in cursor.fetchall() or []:
          page_key = str(row['project_page_id'])
          bindings_by_page.setdefault(page_key, []).append(
            ProjectBindingDetail(**{**row, 'id': str(row['id']), 'project_page_id': page_key})
          )

        cursor.execute(
          'SELECT * FROM report_project_page_files WHERE project_page_id = ANY(%s::uuid[]) ORDER BY created_at DESC',
          (page_ids,),
        )
        for row in cursor.fetchall() or []:
          page_key = str(row['project_page_id'])
          files_by_page.setdefault(page_key, []).append(
            ProjectFileDetail(**{**row, 'id': str(row['id']), 'project_page_id': page_key})
          )

      cursor.execute(
        'SELECT * FROM project_chat_messages WHERE project_id = %s ORDER BY created_at ASC',
        (project_id,),
      )
      messages = [
        ProjectChatMessageDetail(**{**row, 'id': str(row['id']), 'project_id': str(row['project_id'])})
        for row in (cursor.fetchall() or [])
      ]

      pages = [
        ProjectPageDetail(
          **{
            **row,
            'id': str(row['id']),
            'project_id': str(row['project_id']),
            'bindings': bindings_by_page.get(str(row['id']), []),
            'files': files_by_page.get(str(row['id']), []),
          }
        )
        for row in page_rows
      ]

      return ProjectDetail(
        id=str(project_row['id']),
        student_id=str(project_row['student_id']) if project_row.get('student_id') else None,
        report_type=project_row['report_type'],
        report_template_id=str(project_row['report_template_id']) if project_row.get('report_template_id') else None,
        ppt_template_id=str(project_row['ppt_template_id']) if project_row.get('ppt_template_id') else None,
        prompt=project_row.get('prompt'),
        status=project_row.get('status') or 'draft',
        pages=pages,
        messages=messages,
        created_at=project_row['created_at'],
        updated_at=project_row['updated_at'],
      )

  def get_project(self, project_id: str) -> ProjectDetail | None:
    with get_connection() as conn:
      return self._fetch_project_detail_in_conn(conn, project_id)

  def _replace_project_nested(self, conn, project_id: str, payload: ProjectPayload) -> None:
    with conn.cursor() as cursor:
      cursor.execute(
        '''
        DELETE FROM report_project_page_bindings
        WHERE project_page_id IN (SELECT id FROM report_project_pages WHERE project_id = %s)
        ''',
        (project_id,),
      )
      cursor.execute(
        '''
        DELETE FROM report_project_page_files
        WHERE project_page_id IN (SELECT id FROM report_project_pages WHERE project_id = %s)
        ''',
        (project_id,),
      )
      cursor.execute('DELETE FROM report_project_pages WHERE project_id = %s', (project_id,))
      cursor.execute('DELETE FROM project_chat_messages WHERE project_id = %s', (project_id,))

      for page in payload.pages:
        page_id = _valid_uuid(page.id)
        if page_id:
          cursor.execute(
            '''
            INSERT INTO report_project_pages (
              id, project_id, page_order, title, description, slide_hint, manual_text
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            ''',
            (page_id, project_id, page.page_order, page.title, page.description, page.slide_hint, page.manual_text),
          )
        else:
          cursor.execute(
            '''
            INSERT INTO report_project_pages (
              project_id, page_order, title, description, slide_hint, manual_text
            ) VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            ''',
            (project_id, page.page_order, page.title, page.description, page.slide_hint, page.manual_text),
          )
        created_page_id = str(cursor.fetchone()['id'])

        for binding in page.bindings:
          binding_id = _valid_uuid(binding.id)
          if binding_id:
            cursor.execute(
              '''
              INSERT INTO report_project_page_bindings (
                id, project_page_id, binding_group, field_name, field_order
              ) VALUES (%s, %s, %s, %s, %s)
              ''',
              (binding_id, created_page_id, binding.binding_group, binding.field_name, binding.field_order),
            )
          else:
            cursor.execute(
              '''
              INSERT INTO report_project_page_bindings (
                project_page_id, binding_group, field_name, field_order
              ) VALUES (%s, %s, %s, %s)
              ''',
              (created_page_id, binding.binding_group, binding.field_name, binding.field_order),
            )

        for file in page.files:
          file_id = _valid_uuid(file.id)
          if file_id:
            cursor.execute(
              '''
              INSERT INTO report_project_page_files (
                id, project_page_id, file_name, file_type, mime_type, file_path, file_size, description, created_at
              ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, COALESCE(%s, NOW()))
              ''',
              (
                file_id,
                created_page_id,
                file.file_name,
                file.file_type,
                file.mime_type,
                file.file_path,
                file.file_size,
                file.description,
                file.created_at,
              ),
            )
          else:
            cursor.execute(
              '''
              INSERT INTO report_project_page_files (
                project_page_id, file_name, file_type, mime_type, file_path, file_size, description, created_at
              ) VALUES (%s, %s, %s, %s, %s, %s, %s, COALESCE(%s, NOW()))
              ''',
              (
                created_page_id,
                file.file_name,
                file.file_type,
                file.mime_type,
                file.file_path,
                file.file_size,
                file.description,
                file.created_at,
              ),
            )

      for message in payload.messages:
        message_id = _valid_uuid(message.id)
        if message_id:
          cursor.execute(
            '''
            INSERT INTO project_chat_messages (id, project_id, role, content, created_at)
            VALUES (%s, %s, %s, %s, COALESCE(%s, NOW()))
            ''',
            (message_id, project_id, message.role, message.content, message.created_at),
          )
        else:
          cursor.execute(
            '''
            INSERT INTO project_chat_messages (project_id, role, content, created_at)
            VALUES (%s, %s, %s, COALESCE(%s, NOW()))
            ''',
            (project_id, message.role, message.content, message.created_at),
          )

  def create_project(self, payload: ProjectPayload) -> ProjectDetail:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          INSERT INTO report_projects (
            student_id, report_type, report_template_id, ppt_template_id, prompt, status
          ) VALUES (%s, %s, %s, %s, %s, %s)
          RETURNING id
          ''',
          (
            _valid_uuid(payload.student_id),
            payload.report_type,
            _valid_uuid(payload.report_template_id),
            _valid_uuid(payload.ppt_template_id),
            payload.prompt,
            payload.status,
          ),
        )
        project_id = str(cursor.fetchone()['id'])
        self._replace_project_nested(conn, project_id, payload)
      return self._fetch_project_detail_in_conn(conn, project_id)  # type: ignore[return-value]

  def update_project(self, project_id: str, payload: ProjectPayload) -> ProjectDetail | None:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          UPDATE report_projects
          SET
            student_id = %s,
            report_type = %s,
            report_template_id = %s,
            ppt_template_id = %s,
            prompt = %s,
            status = %s
          WHERE id = %s
          RETURNING id
          ''',
          (
            _valid_uuid(payload.student_id),
            payload.report_type,
            _valid_uuid(payload.report_template_id),
            _valid_uuid(payload.ppt_template_id),
            payload.prompt,
            payload.status,
            project_id,
          ),
        )
        if not cursor.fetchone():
          return None
        self._replace_project_nested(conn, project_id, payload)
      return self._fetch_project_detail_in_conn(conn, project_id)

  def delete_project(self, project_id: str) -> bool:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute('DELETE FROM report_projects WHERE id = %s', (project_id,))
        return cursor.rowcount > 0

  def list_histories(self):
    from app.models.schemas import GenerationHistoryListItem

    rows = self._fetchall(
      '''
      SELECT *
      FROM generation_histories
      ORDER BY created_at DESC
      '''
    )
    return [
      GenerationHistoryListItem(
        **_stringify_fields(row, 'id', 'project_id', 'student_id', 'ppt_template_id', 'report_template_id')
      )
      for row in rows
    ]

  def get_history_entry(self, history_id: str):
    from app.models.schemas import GenerationHistoryDetail

    row = self._fetchone('SELECT * FROM generation_histories WHERE id = %s', (history_id,))
    if not row:
      return None
    return GenerationHistoryDetail(
      **_stringify_fields(row, 'id', 'project_id', 'student_id', 'ppt_template_id', 'report_template_id')
    )

  def create_history_entry(self, payload):
    from app.models.schemas import GenerationHistoryDetail

    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          INSERT INTO generation_histories (
            project_id, student_id, report_title, ppt_template_id, report_template_id,
            output_format, status, output_file_path
          ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
          RETURNING *
          ''',
          (
            _valid_uuid(payload.project_id),
            _valid_uuid(payload.student_id),
            payload.report_title,
            _valid_uuid(payload.ppt_template_id),
            _valid_uuid(payload.report_template_id),
            payload.output_format,
            payload.status,
            payload.output_file_path,
          ),
        )
        row = cursor.fetchone()
    return GenerationHistoryDetail(
      **_stringify_fields(row, 'id', 'project_id', 'student_id', 'ppt_template_id', 'report_template_id')
    )

  def update_history_entry(self, history_id: str, payload):
    from app.models.schemas import GenerationHistoryDetail

    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute(
          '''
          UPDATE generation_histories
          SET
            project_id = %s,
            student_id = %s,
            report_title = %s,
            ppt_template_id = %s,
            report_template_id = %s,
            output_format = %s,
            status = %s,
            output_file_path = %s
          WHERE id = %s
          RETURNING *
          ''',
          (
            _valid_uuid(payload.project_id),
            _valid_uuid(payload.student_id),
            payload.report_title,
            _valid_uuid(payload.ppt_template_id),
            _valid_uuid(payload.report_template_id),
            payload.output_format,
            payload.status,
            payload.output_file_path,
            history_id,
          ),
        )
        row = cursor.fetchone()
        if not row:
          return None
    return GenerationHistoryDetail(
      **_stringify_fields(row, 'id', 'project_id', 'student_id', 'ppt_template_id', 'report_template_id')
    )

  def delete_history_entry(self, history_id: str) -> bool:
    with get_connection() as conn:
      with conn.transaction(), conn.cursor() as cursor:
        cursor.execute('DELETE FROM generation_histories WHERE id = %s', (history_id,))
        return cursor.rowcount > 0

  def build_workbench_data(self) -> WorkbenchData:
    student_count_row = self._fetchone('SELECT COUNT(*) AS total FROM students')
    template_count_row = self._fetchone('SELECT COUNT(*) AS total FROM ppt_templates')
    avg_page_row = self._fetchone('SELECT COALESCE(AVG(page_count), 0) AS avg_page_count FROM ppt_templates')
    history_stats_row = self._fetchone(
      '''
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) = 'completed') AS success_count
      FROM generation_histories
      '''
    )
    queue_rows = self._fetchall(
      '''
      SELECT
        rp.id,
        rp.status,
        rp.updated_at,
        s.name AS student_name,
        pt.name AS template_name
      FROM report_projects rp
      LEFT JOIN students s ON s.id = rp.student_id
      LEFT JOIN ppt_templates pt ON pt.id = rp.ppt_template_id
      ORDER BY rp.updated_at DESC
      LIMIT 4
      '''
    )
    template_rows = self._fetchall(
      '''
      SELECT
        pt.*,
        COUNT(gh.id) AS usage_count
      FROM ppt_templates pt
      LEFT JOIN generation_histories gh ON gh.ppt_template_id = pt.id
      GROUP BY pt.id
      ORDER BY pt.updated_at DESC
      LIMIT 3
      '''
    )
    outline_rows = self._fetchall(
      '''
      SELECT title, summary, COALESCE(recommended_pages, '1-2页') AS recommended_pages
      FROM report_template_sections
      ORDER BY section_order ASC
      LIMIT 6
      '''
    )

    total_histories = int(history_stats_row['total']) if history_stats_row else 0
    success_count = int(history_stats_row['success_count']) if history_stats_row else 0
    success_rate = 0 if total_histories == 0 else round(success_count * 100 / total_histories, 1)
    latest_history = self._fetchone('SELECT created_at FROM generation_histories ORDER BY created_at DESC LIMIT 1')

    summary = [
      Metric(label='学生总数', value=str(int(student_count_row['total']) if student_count_row else 0), detail='数据库中的学生记录', accent='ink'),
      Metric(label='PPT模板数', value=str(int(template_count_row['total']) if template_count_row else 0), detail='数据库中的PPT模板', accent='emerald'),
      Metric(label='平均模板页数', value=str(round(float(avg_page_row['avg_page_count']) if avg_page_row else 0, 1)), detail='按模板解析结果统计', accent='amber'),
      Metric(label='生成成功率', value=f'{success_rate}%', detail=f"最近生成：{_as_datetime_text(latest_history['created_at']) if latest_history else '暂无'}", accent='azure'),
    ]

    queue = [
      QueueItem(
        studentName=row.get('student_name') or '未关联学生',
        templateName=row.get('template_name') or '未选择模板',
        eta='等待后续生成逻辑',
        status=row.get('status') or 'draft',
        progress=100 if (row.get('status') or '').lower() == 'completed' else 40,
      )
      for row in queue_rows
    ]

    outline = [
      OutlineBlock(
        title=row['title'],
        description=row.get('summary') or '',
        slideHint=row.get('recommended_pages') or '1-2页',
        emphasis='来自报告模板章节',
      )
      for row in outline_rows
    ]

    return WorkbenchData(
      heroTips=[],
      modes=[
        GenerationMode(id='topic', label='输入主题', helper='先生成结构和文案'),
        GenerationMode(id='upload', label='上传数据包', helper='适合已有Excel或截图'),
        GenerationMode(id='outline', label='粘贴教学纪要', helper='按老师总结自动排版'),
      ],
      summary=summary,
      queue=queue,
      outline=outline,
      suggestedTemplates=[self._build_template_item(row, index, int(row.get('usage_count') or 0)) for index, row in enumerate(template_rows)],
    )

  def build_template_center_data(self) -> TemplateCenterData:
    rows = self._fetchall(
      '''
      SELECT
        pt.*,
        COUNT(gh.id) AS usage_count
      FROM ppt_templates pt
      LEFT JOIN generation_histories gh ON gh.ppt_template_id = pt.id
      GROUP BY pt.id
      ORDER BY pt.updated_at DESC, pt.created_at DESC
      '''
    )
    template_items = [self._build_template_item(row, index, int(row.get('usage_count') or 0)) for index, row in enumerate(rows)]
    categories = ['全部']
    categories.extend(sorted({item.category for item in template_items if item.category}))
    featured = (
      template_items[0]
      if template_items
      else TemplateItem(
        id='empty',
        title='暂无模板',
        description='',
        category='未分类',
        tags=[],
        slides=0,
        usageCount=0,
        colorA='#153b5c',
        colorB='#4ad1c8',
      )
    )
    report_templates = [
      ReportTemplateSummary(
        id=item.id,
        name=item.name,
        description='',
        reportType=item.report_type,
        scene='',
        updatedAt=_as_datetime_text(item.updated_at),
        status=item.status,
        sections=[],
      )
      for item in self.list_report_templates()
    ]
    return TemplateCenterData(
      categories=categories,
      featured=featured,
      templates=template_items,
      modules=[],
      reportTemplates=report_templates,
    )

  def build_data_management_data(self) -> DataManagementData:
    students = [self.get_student(item.id) for item in self.list_students()]
    student_records = [
      StudentRecord(
        id=item.id,
        name=item.name,
        grade=item.grade or '',
        className=item.current_semester or item.institution or '',
        courses=item.lesson_data.tutoring_subjects or item.learning_profile.strength_subjects or '',
        score=int(item.lesson_data.used_hours or 0),
        homework=int(item.lesson_data.total_hours or 0),
        attendance=100,
        reportStatus=item.status,
        teacherNote=item.ai_copy.course_feedback or item.learning_profile.weakness or '',
      )
      for item in students
      if item is not None
    ]
    latest_student = self._fetchone('SELECT updated_at FROM students ORDER BY updated_at DESC LIMIT 1')
    template_count = self._fetchone('SELECT COUNT(*) AS total FROM report_templates')
    pending_student_count = self._fetchone("SELECT COUNT(*) AS total FROM students WHERE LOWER(status) <> 'completed'")
    stats = [
      Metric(label='学生总数', value=str(len(student_records)), detail='已录入学生', accent='ink'),
      Metric(label='最近更新', value=_as_datetime_text(latest_student['updated_at']) if latest_student else '暂无', detail='学生资料最后更新时间', accent='azure'),
      Metric(label='待补充学生', value=str(int(pending_student_count['total']) if pending_student_count else 0), detail='状态未完成的学生', accent='amber'),
      Metric(label='报告模板数', value=str(int(template_count['total']) if template_count else 0), detail='可绑定报告模板', accent='emerald'),
    ]
    return DataManagementData(
      stats=stats,
      sources=[DataSource(name='students', description='学生主表', status='connected', syncedAt='数据库实时', coverage=str(len(student_records)))],
      students=student_records,
      imports=[],
      warnings=[],
    )

  def build_history_data(self) -> HistoryData:
    rows = self._fetchall(
      '''
      SELECT
        gh.*,
        s.name AS student_name,
        pt.name AS ppt_template_name
      FROM generation_histories gh
      LEFT JOIN students s ON s.id = gh.student_id
      LEFT JOIN ppt_templates pt ON pt.id = gh.ppt_template_id
      ORDER BY gh.created_at DESC
      LIMIT 50
      '''
    )
    total_row = self._fetchone('SELECT COUNT(*) AS total FROM generation_histories')
    latest_row = self._fetchone('SELECT created_at FROM generation_histories ORDER BY created_at DESC LIMIT 1')
    stats = [
      Metric(label='历史记录数', value=str(int(total_row['total']) if total_row else 0), detail='累计生成记录', accent='ink'),
      Metric(label='最近一次生成', value=_as_datetime_text(latest_row['created_at']) if latest_row else '暂无', detail='最近输出时间', accent='azure'),
      Metric(label='已完成', value=str(sum(1 for row in rows if (row.get('status') or '').lower() == 'completed')), detail='当前列表中的完成项', accent='emerald'),
      Metric(label='待处理', value=str(sum(1 for row in rows if (row.get('status') or '').lower() != 'completed')), detail='当前列表中的未完成项', accent='amber'),
    ]
    records = [
      HistoryRecord(
        id=str(row['id']),
        title=row.get('report_title') or '未命名报告',
        template=row.get('ppt_template_name') or '未选择模板',
        format=row.get('output_format') or '',
        createdAt=_as_datetime_text(row.get('created_at')),
        students=row.get('student_name') or '未关联学生',
        status=row.get('status') or '',
        owner='系统任务',
        lastAction='记录已入库',
        notes=row.get('output_file_path') or '',
      )
      for row in rows
    ]
    return HistoryData(stats=stats, records=records)


postgres_repository = PostgresRepository()
