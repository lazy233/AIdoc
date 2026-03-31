from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class Metric(BaseModel):
  label: str
  value: str
  detail: str
  accent: Literal['ink', 'emerald', 'amber', 'azure']


class GenerationMode(BaseModel):
  id: Literal['topic', 'upload', 'outline']
  label: str
  helper: str


class QueueItem(BaseModel):
  studentName: str
  templateName: str
  eta: str
  status: str
  progress: int


class OutlineBlock(BaseModel):
  title: str
  description: str
  slideHint: str
  emphasis: str


class TemplateItem(BaseModel):
  id: str
  title: str
  description: str
  category: str
  tags: list[str]
  slides: int
  usageCount: int
  colorA: str
  colorB: str
  premium: bool = False


class ModuleItem(BaseModel):
  name: str
  description: str
  recommendedSlides: str


class DataSource(BaseModel):
  name: str
  description: str
  status: str
  syncedAt: str
  coverage: str


class StudentRecord(BaseModel):
  id: str
  name: str
  grade: str
  className: str
  courses: str
  score: int
  homework: int
  attendance: int
  reportStatus: str
  teacherNote: str


class ImportRecord(BaseModel):
  source: str
  status: str
  count: str
  updatedAt: str


class HistoryRecord(BaseModel):
  id: str
  title: str
  template: str
  format: str
  createdAt: str
  students: str
  status: str
  owner: str
  lastAction: str
  notes: str


class ReportTemplateSectionSummary(BaseModel):
  id: str
  title: str
  summary: str
  contentPoints: list[str]
  dataBindings: list[str]
  recommendedPages: str


class ReportTemplateSummary(BaseModel):
  id: str
  name: str
  description: str = ''
  reportType: str
  scene: str = ''
  updatedAt: str
  status: str
  sections: list[ReportTemplateSectionSummary] = Field(default_factory=list)


class WorkbenchData(BaseModel):
  heroTips: list[str]
  modes: list[GenerationMode]
  summary: list[Metric]
  queue: list[QueueItem]
  outline: list[OutlineBlock]
  suggestedTemplates: list[TemplateItem]


class TemplateCenterData(BaseModel):
  categories: list[str]
  featured: TemplateItem
  templates: list[TemplateItem]
  modules: list[ModuleItem] = Field(default_factory=list)
  reportTemplates: list[ReportTemplateSummary] = Field(default_factory=list)


class DataManagementData(BaseModel):
  stats: list[Metric]
  sources: list[DataSource]
  students: list[StudentRecord]
  imports: list[ImportRecord]
  warnings: list[str]


class HistoryData(BaseModel):
  stats: list[Metric]
  records: list[HistoryRecord]


class OperationStatus(BaseModel):
  success: bool = True
  message: str


class UploadedFileInfo(BaseModel):
  file_name: str
  file_path: str
  file_size: int
  mime_type: str | None = None
  file_type: str | None = None
  description: str | None = None
  created_at: datetime


class StudentLearningProfilePayload(BaseModel):
  strength_subjects: str | None = None
  international_score: str | None = None
  study_intent: str | None = None
  career_intent: str | None = None
  interest_subjects: str | None = None
  long_term_plan: str | None = None
  learning_style: str | None = None
  weakness: str | None = None


class StudentLessonDataPayload(BaseModel):
  total_hours: float | None = None
  used_hours: float | None = None
  remaining_hours: float | None = None
  tutoring_subjects: str | None = None
  preview_subjects: str | None = None
  skill_focus: str | None = None
  skill_description: str | None = None


class StudentAICopyPayload(BaseModel):
  term_overview: str | None = None
  course_feedback: str | None = None
  short_term_advice: str | None = None
  long_term_roadmap: str | None = None


class StudentFilePayload(BaseModel):
  id: str | None = None
  file_name: str
  file_type: str | None = None
  mime_type: str | None = None
  file_path: str
  file_size: int | None = None
  description: str | None = None
  created_at: datetime | None = None


class StudentPayload(BaseModel):
  student_no: str | None = None
  name: str
  nickname: str | None = None
  institution: str | None = None
  major: str | None = None
  grade: str | None = None
  current_semester: str | None = None
  report_subtitle: str | None = None
  service_start_date: date | None = None
  advisor_name: str | None = None
  report_title: str | None = None
  status: str = 'draft'
  learning_profile: StudentLearningProfilePayload = Field(default_factory=StudentLearningProfilePayload)
  lesson_data: StudentLessonDataPayload = Field(default_factory=StudentLessonDataPayload)
  ai_copy: StudentAICopyPayload = Field(default_factory=StudentAICopyPayload)
  files: list[StudentFilePayload] = Field(default_factory=list)


class StudentListItem(BaseModel):
  id: str
  student_no: str | None = None
  name: str
  nickname: str | None = None
  institution: str | None = None
  major: str | None = None
  grade: str | None = None
  current_semester: str | None = None
  advisor_name: str | None = None
  status: str
  file_count: int = 0
  updated_at: datetime


class StudentDetail(StudentPayload):
  id: str
  created_at: datetime
  updated_at: datetime


class PptTemplateSectionPayload(BaseModel):
  id: str | None = None
  section_order: int
  section_title: str
  start_page_no: int | None = None
  end_page_no: int | None = None
  page_count: int = 0
  summary: str | None = None


class PptTemplateComponentPayload(BaseModel):
  id: str | None = None
  component_order: int
  component_type: str
  component_name: str | None = None
  placeholder_key: str | None = None
  text_content: str | None = None
  x: float | None = None
  y: float | None = None
  width: float | None = None
  height: float | None = None
  z_index: int = 0
  style_json: dict[str, Any] = Field(default_factory=dict)
  binding_hint: str | None = None
  raw_component_json: dict[str, Any] = Field(default_factory=dict)


class PptTemplatePagePayload(BaseModel):
  id: str | None = None
  section_order: int | None = None
  page_no: int
  page_title: str | None = None
  page_type: str | None = None
  layout_name: str | None = None
  notes: str | None = None
  component_count: int = 0
  snapshot_path: str | None = None
  raw_page_json: dict[str, Any] = Field(default_factory=dict)
  components: list[PptTemplateComponentPayload] = Field(default_factory=list)


class PptTemplatePayload(BaseModel):
  name: str
  category: str | None = None
  status: str = 'draft'
  source_file_name: str | None = None
  source_file_path: str
  cover_image_path: str | None = None
  file_size: int | None = None
  page_count: int = 0
  aspect_ratio: str | None = None
  theme_name: str | None = None
  template_version: str | None = None
  parse_status: str = 'pending'
  parse_error: str | None = None
  outline_json: list[dict[str, Any]] = Field(default_factory=list)
  pages_json: list[dict[str, Any]] = Field(default_factory=list)
  components_json: list[dict[str, Any]] = Field(default_factory=list)
  style_tokens_json: dict[str, Any] = Field(default_factory=dict)
  slot_bindings_json: dict[str, Any] = Field(default_factory=dict)
  parsed_at: datetime | None = None
  sections: list[PptTemplateSectionPayload] = Field(default_factory=list)
  pages: list[PptTemplatePagePayload] = Field(default_factory=list)


class PptTemplateListItem(BaseModel):
  id: str
  name: str
  category: str | None = None
  status: str
  source_file_name: str | None = None
  page_count: int
  parse_status: str
  parsed_at: datetime | None = None
  updated_at: datetime


class PptTemplateSectionDetail(PptTemplateSectionPayload):
  id: str
  created_at: datetime
  updated_at: datetime


class PptTemplateComponentDetail(PptTemplateComponentPayload):
  id: str
  page_id: str
  created_at: datetime
  updated_at: datetime


class PptTemplatePageDetail(PptTemplatePagePayload):
  id: str
  section_id: str | None = None
  created_at: datetime
  updated_at: datetime
  components: list[PptTemplateComponentDetail] = Field(default_factory=list)


class PptTemplateDetail(PptTemplatePayload):
  id: str
  created_at: datetime
  updated_at: datetime
  sections: list[PptTemplateSectionDetail] = Field(default_factory=list)
  pages: list[PptTemplatePageDetail] = Field(default_factory=list)


class ReportTemplateSectionPayload(BaseModel):
  id: str | None = None
  section_order: int
  title: str
  summary: str | None = None
  content_points: list[str] = Field(default_factory=list)
  data_bindings: list[str] = Field(default_factory=list)
  recommended_pages: str | None = None


class ReportTemplatePayload(BaseModel):
  name: str
  report_type: str
  status: str = 'draft'
  sections: list[ReportTemplateSectionPayload] = Field(default_factory=list)


class ReportTemplateListItem(BaseModel):
  id: str
  name: str
  report_type: str
  status: str
  section_count: int = 0
  updated_at: datetime


class ReportTemplateSectionDetail(ReportTemplateSectionPayload):
  id: str
  created_at: datetime
  updated_at: datetime


class ReportTemplateDetail(ReportTemplatePayload):
  id: str
  created_at: datetime
  updated_at: datetime
  sections: list[ReportTemplateSectionDetail] = Field(default_factory=list)


class ProjectBindingPayload(BaseModel):
  id: str | None = None
  binding_group: str
  field_name: str
  field_order: int = 1


class ProjectFilePayload(BaseModel):
  id: str | None = None
  file_name: str
  file_type: str | None = None
  mime_type: str | None = None
  file_path: str
  file_size: int | None = None
  description: str | None = None
  created_at: datetime | None = None


class ProjectPagePayload(BaseModel):
  id: str | None = None
  page_order: int
  title: str | None = None
  description: str | None = None
  slide_hint: str | None = None
  manual_text: str | None = None
  bindings: list[ProjectBindingPayload] = Field(default_factory=list)
  files: list[ProjectFilePayload] = Field(default_factory=list)


class ProjectChatMessagePayload(BaseModel):
  id: str | None = None
  role: str
  content: str
  created_at: datetime | None = None


class ProjectPayload(BaseModel):
  student_id: str | None = None
  report_type: str
  report_template_id: str | None = None
  ppt_template_id: str | None = None
  prompt: str | None = None
  status: str = 'draft'
  pages: list[ProjectPagePayload] = Field(default_factory=list)
  messages: list[ProjectChatMessagePayload] = Field(default_factory=list)


class ProjectListItem(BaseModel):
  id: str
  student_id: str | None = None
  report_type: str
  report_template_id: str | None = None
  ppt_template_id: str | None = None
  prompt: str | None = None
  status: str
  page_count: int = 0
  updated_at: datetime


class ProjectBindingDetail(ProjectBindingPayload):
  id: str
  project_page_id: str
  created_at: datetime


class ProjectFileDetail(ProjectFilePayload):
  id: str
  project_page_id: str
  created_at: datetime


class ProjectPageDetail(ProjectPagePayload):
  id: str
  project_id: str
  created_at: datetime
  updated_at: datetime
  bindings: list[ProjectBindingDetail] = Field(default_factory=list)
  files: list[ProjectFileDetail] = Field(default_factory=list)


class ProjectChatMessageDetail(ProjectChatMessagePayload):
  id: str
  project_id: str
  created_at: datetime


class ProjectDetail(ProjectPayload):
  id: str
  created_at: datetime
  updated_at: datetime
  pages: list[ProjectPageDetail] = Field(default_factory=list)
  messages: list[ProjectChatMessageDetail] = Field(default_factory=list)


class GenerationHistoryPayload(BaseModel):
  project_id: str | None = None
  student_id: str | None = None
  report_title: str | None = None
  ppt_template_id: str | None = None
  report_template_id: str | None = None
  output_format: str | None = None
  status: str | None = None
  output_file_path: str | None = None


class GenerationHistoryListItem(BaseModel):
  id: str
  project_id: str | None = None
  student_id: str | None = None
  report_title: str | None = None
  output_format: str | None = None
  status: str | None = None
  created_at: datetime


class GenerationHistoryDetail(GenerationHistoryPayload):
  id: str
  created_at: datetime


class ReportGenerationRequest(BaseModel):
  topic: str
  templateId: str = 'term-growth'
  studentIds: list[str] = Field(default_factory=list)
  pageCount: int = 24
  outputFormat: Literal['pptx', 'pdf', 'pptx+pdf'] = 'pptx+pdf'
  tone: str = 'professional'
  includeModules: list[str] = Field(default_factory=list)


class GeneratedArtifact(BaseModel):
  fileName: str
  relativePath: str
  slides: int
  status: str
  outputFormat: str
  createdAt: datetime


class ReportGenerationResponse(BaseModel):
  taskId: str
  status: str
  message: str
  artifact: GeneratedArtifact
  outline: list[OutlineBlock]
