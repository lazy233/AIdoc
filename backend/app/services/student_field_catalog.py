"""学生档案可选用数据字段清单（仅 id / 分组 / 说明），不包含任何业务取值。"""

from __future__ import annotations

# (分组, [(字段 id, 中文名, 可选补充说明)])
_CATALOG_SPEC: list[tuple[str, list[tuple[str, str, str]]]] = [
  (
    '基础信息',
    [
      ('name', '姓名', ''),
      ('student_no', '学号', ''),
      ('nickname', '昵称', ''),
      ('institution', '学校/机构', ''),
      ('major', '专业', ''),
      ('grade', '年级', ''),
      ('current_semester', '当前学期', ''),
      ('report_subtitle', '报告副标题', ''),
      ('advisor_name', '顾问/班主任', ''),
      ('report_title', '报告标题', ''),
      ('status', '学生状态', ''),
    ],
  ),
  (
    '学习画像',
    [
      ('learning_profile.strength_subjects', '优势学科', ''),
      ('learning_profile.international_score', '标化/国际考试分数', ''),
      ('learning_profile.study_intent', '升学意向', ''),
      ('learning_profile.career_intent', '职业意向', ''),
      ('learning_profile.interest_subjects', '兴趣学科', ''),
      ('learning_profile.long_term_plan', '长期规划摘要', ''),
      ('learning_profile.learning_style', '学习风格', ''),
      ('learning_profile.weakness', '薄弱点/待提升', ''),
    ],
  ),
  (
    '课时与科目',
    [
      ('lesson_data.total_hours', '总课时', ''),
      ('lesson_data.used_hours', '已用课时', ''),
      ('lesson_data.remaining_hours', '剩余课时', ''),
      ('lesson_data.tutoring_subjects', '辅导科目', ''),
      ('lesson_data.preview_subjects', '试听科目', ''),
      ('lesson_data.skill_focus', '技能重点', ''),
      ('lesson_data.skill_description', '技能说明', ''),
    ],
  ),
  (
    'AI生成文案',
    [
      ('ai_copy.term_overview', '学期总览文案', ''),
      ('ai_copy.course_feedback', '课程反馈文案', ''),
      ('ai_copy.short_term_advice', '短期建议文案', ''),
      ('ai_copy.long_term_roadmap', '长期路线图文案', ''),
    ],
  ),
  (
    '学习材料',
    [
      ('student.attachments', '学生已上传附件', '表示可在该章节引用附件素材（不含文件名与文件内容）'),
    ],
  ),
]


def list_student_field_catalog() -> list[dict[str, str]]:
  out: list[dict[str, str]] = []
  for group, fields in _CATALOG_SPEC:
    for fid, label, desc in fields:
      item: dict[str, str] = {'id': fid, 'group': group, 'label': label}
      if desc:
        item['description'] = desc
      out.append(item)
  return out
