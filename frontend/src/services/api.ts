import type {
  DataManagementData,
  HistoryData,
  ReportTemplate,
  ReportTemplateSection,
  TemplateCenterData,
  WorkbenchData,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface StudentListItemApi {
  id: string;
  student_no?: string | null;
  name: string;
  nickname?: string | null;
  institution?: string | null;
  major?: string | null;
  grade?: string | null;
  current_semester?: string | null;
  advisor_name?: string | null;
  status: string;
  file_count: number;
  updated_at: string;
}

export interface StudentLearningProfileApi {
  strength_subjects?: string | null;
  international_score?: string | null;
  study_intent?: string | null;
  career_intent?: string | null;
  interest_subjects?: string | null;
  long_term_plan?: string | null;
  learning_style?: string | null;
  weakness?: string | null;
}

export interface StudentLessonDataApi {
  total_hours?: number | null;
  used_hours?: number | null;
  remaining_hours?: number | null;
  tutoring_subjects?: string | null;
  preview_subjects?: string | null;
  skill_focus?: string | null;
  skill_description?: string | null;
}

export interface StudentAICopyApi {
  term_overview?: string | null;
  course_feedback?: string | null;
  short_term_advice?: string | null;
  long_term_roadmap?: string | null;
}

export interface StudentFileApi {
  id?: string | null;
  file_name: string;
  file_type?: string | null;
  mime_type?: string | null;
  file_path: string;
  file_size?: number | null;
  description?: string | null;
  created_at?: string | null;
}

export interface StudentDetailApi {
  id: string;
  student_no?: string | null;
  name: string;
  nickname?: string | null;
  institution?: string | null;
  major?: string | null;
  grade?: string | null;
  current_semester?: string | null;
  report_subtitle?: string | null;
  service_start_date?: string | null;
  advisor_name?: string | null;
  report_title?: string | null;
  status: string;
  learning_profile: StudentLearningProfileApi;
  lesson_data: StudentLessonDataApi;
  ai_copy: StudentAICopyApi;
  files: StudentFileApi[];
  created_at: string;
  updated_at: string;
}

export interface StudentPayloadApi {
  student_no?: string | null;
  name: string;
  nickname?: string | null;
  institution?: string | null;
  major?: string | null;
  grade?: string | null;
  current_semester?: string | null;
  report_subtitle?: string | null;
  service_start_date?: string | null;
  advisor_name?: string | null;
  report_title?: string | null;
  status: string;
  learning_profile: StudentLearningProfileApi;
  lesson_data: StudentLessonDataApi;
  ai_copy: StudentAICopyApi;
  files: StudentFileApi[];
}

export interface ReportTemplateSectionDetailApi {
  id: string;
  section_order: number;
  title: string;
  summary?: string | null;
  content_points: string[];
  data_bindings: string[];
  recommended_pages?: string | null;
}

export interface ReportTemplateListItemApi {
  id: string;
  name: string;
  report_type: string;
  status: string;
  section_count: number;
  updated_at: string;
}

export interface ReportTemplateDetailApi {
  id: string;
  name: string;
  report_type: string;
  status: string;
  sections: ReportTemplateSectionDetailApi[];
  created_at: string;
  updated_at: string;
}

export interface ReportTemplatePayloadApi {
  name: string;
  report_type: string;
  status: string;
  sections: Array<{
    id?: string | null;
    section_order: number;
    title: string;
    summary?: string | null;
    content_points: string[];
    data_bindings: string[];
    recommended_pages?: string | null;
  }>;
}

export interface PptTemplateSectionApi {
  id?: string | null;
  section_order: number;
  section_title: string;
  start_page_no?: number | null;
  end_page_no?: number | null;
  page_count: number;
  summary?: string | null;
}

export interface PptTemplateComponentApi {
  id?: string | null;
  component_order: number;
  component_type: string;
  component_name?: string | null;
  placeholder_key?: string | null;
  text_content?: string | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  z_index: number;
  style_json: Record<string, unknown>;
  binding_hint?: string | null;
  raw_component_json: Record<string, unknown>;
}

export interface PptTemplatePageApi {
  id?: string | null;
  section_order?: number | null;
  section_id?: string | null;
  page_no: number;
  page_title?: string | null;
  page_type?: string | null;
  layout_name?: string | null;
  notes?: string | null;
  component_count: number;
  snapshot_path?: string | null;
  raw_page_json: Record<string, unknown>;
  components: PptTemplateComponentApi[];
}

export interface PptTemplateListItemApi {
  id: string;
  name: string;
  category?: string | null;
  status: string;
  source_file_name?: string | null;
  page_count: number;
  parse_status: string;
  parsed_at?: string | null;
  updated_at: string;
}

export interface PptTemplateDetailApi {
  id: string;
  name: string;
  category?: string | null;
  status: string;
  source_file_name?: string | null;
  source_file_path: string;
  cover_image_path?: string | null;
  file_size?: number | null;
  page_count: number;
  aspect_ratio?: string | null;
  theme_name?: string | null;
  template_version?: string | null;
  parse_status: string;
  parse_error?: string | null;
  outline_json: Array<Record<string, unknown>>;
  pages_json: Array<Record<string, unknown>>;
  components_json: Array<Record<string, unknown>>;
  style_tokens_json: Record<string, unknown>;
  slot_bindings_json: Record<string, unknown>;
  parsed_at?: string | null;
  sections: PptTemplateSectionApi[];
  pages: PptTemplatePageApi[];
  created_at: string;
  updated_at: string;
}

export interface PptTemplatePayloadApi {
  name: string;
  category?: string | null;
  status: string;
  source_file_name?: string | null;
  source_file_path: string;
  cover_image_path?: string | null;
  file_size?: number | null;
  page_count: number;
  aspect_ratio?: string | null;
  theme_name?: string | null;
  template_version?: string | null;
  parse_status: string;
  parse_error?: string | null;
  outline_json: Array<Record<string, unknown>>;
  pages_json: Array<Record<string, unknown>>;
  components_json: Array<Record<string, unknown>>;
  style_tokens_json: Record<string, unknown>;
  slot_bindings_json: Record<string, unknown>;
  parsed_at?: string | null;
  sections: PptTemplateSectionApi[];
  pages: PptTemplatePageApi[];
}

export interface ProjectBindingApi {
  id?: string | null;
  binding_group: string;
  field_name: string;
  field_order: number;
}

export interface ProjectFileApi {
  id?: string | null;
  file_name: string;
  file_type?: string | null;
  mime_type?: string | null;
  file_path: string;
  file_size?: number | null;
  description?: string | null;
  created_at?: string | null;
}

export interface ProjectPageApi {
  id?: string | null;
  page_order: number;
  title?: string | null;
  description?: string | null;
  slide_hint?: string | null;
  manual_text?: string | null;
  bindings: ProjectBindingApi[];
  files: ProjectFileApi[];
}

export interface ProjectMessageApi {
  id?: string | null;
  role: string;
  content: string;
  created_at?: string | null;
}

export interface ProjectListItemApi {
  id: string;
  student_id?: string | null;
  report_type: string;
  report_template_id?: string | null;
  ppt_template_id?: string | null;
  prompt?: string | null;
  status: string;
  page_count: number;
  updated_at: string;
}

export interface ProjectDetailApi {
  id: string;
  student_id?: string | null;
  report_type: string;
  report_template_id?: string | null;
  ppt_template_id?: string | null;
  prompt?: string | null;
  status: string;
  pages: ProjectPageApi[];
  messages: ProjectMessageApi[];
  created_at: string;
  updated_at: string;
}

export interface ProjectPayloadApi {
  student_id?: string | null;
  report_type: string;
  report_template_id?: string | null;
  ppt_template_id?: string | null;
  prompt?: string | null;
  status: string;
  pages: ProjectPageApi[];
  messages: ProjectMessageApi[];
}

export interface GenerationHistoryListItemApi {
  id: string;
  project_id?: string | null;
  student_id?: string | null;
  report_title?: string | null;
  output_format?: string | null;
  status?: string | null;
  created_at: string;
}

export interface GenerationHistoryDetailApi {
  id: string;
  project_id?: string | null;
  student_id?: string | null;
  report_title?: string | null;
  ppt_template_id?: string | null;
  report_template_id?: string | null;
  output_format?: string | null;
  status?: string | null;
  output_file_path?: string | null;
  created_at: string;
}

export interface GenerationHistoryPayloadApi {
  project_id?: string | null;
  student_id?: string | null;
  report_title?: string | null;
  ppt_template_id?: string | null;
  report_template_id?: string | null;
  output_format?: string | null;
  status?: string | null;
  output_file_path?: string | null;
}

export interface UploadedFileApi {
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string | null;
  file_type?: string | null;
  description?: string | null;
  created_at: string;
}

function ensureHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: ensureHeaders(init),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function mapReportTemplate(detail: ReportTemplateDetailApi): ReportTemplate {
  return {
    id: detail.id,
    name: detail.name,
    description: '',
    reportType: detail.report_type,
    scene: '',
    updatedAt: detail.updated_at,
    status: detail.status,
    sections: detail.sections
      .slice()
      .sort((a, b) => a.section_order - b.section_order)
      .map(
        (section): ReportTemplateSection => ({
          id: section.id,
          title: section.title,
          summary: section.summary ?? '',
          contentPoints: section.content_points ?? [],
          dataBindings: section.data_bindings ?? [],
          recommendedPages: section.recommended_pages ?? '',
        }),
      ),
  };
}

function mapReportTemplatePayload(template: ReportTemplate): ReportTemplatePayloadApi {
  return {
    name: template.name,
    report_type: template.reportType,
    status: template.status,
    sections: template.sections.map((section, index) => ({
      id: section.id,
      section_order: index + 1,
      title: section.title,
      summary: section.summary,
      content_points: section.contentPoints,
      data_bindings: section.dataBindings,
      recommended_pages: section.recommendedPages,
    })),
  };
}

export function getWorkbench() {
  return requestJson<WorkbenchData>('/workbench');
}

export function getTemplateCenter() {
  return requestJson<TemplateCenterData>('/templates');
}

export function getDataManagement() {
  return requestJson<DataManagementData>('/data');
}

export function getHistory() {
  return requestJson<HistoryData>('/history');
}

export function listStudents(keyword?: string) {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
  return requestJson<StudentListItemApi[]>(`/students${query}`);
}

export function getStudent(studentId: string) {
  return requestJson<StudentDetailApi>(`/students/${studentId}`);
}

export function createStudent(payload: StudentPayloadApi) {
  return requestJson<StudentDetailApi>('/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateStudent(studentId: string, payload: StudentPayloadApi) {
  return requestJson<StudentDetailApi>(`/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteStudent(studentId: string) {
  await requestJson<{ success: boolean; message: string }>(`/students/${studentId}`, {
    method: 'DELETE',
  });
}

export async function listReportTemplates() {
  const templates = await requestJson<ReportTemplateListItemApi[]>('/report-templates');
  const details = await Promise.all(
    templates.map((template) => requestJson<ReportTemplateDetailApi>(`/report-templates/${template.id}`)),
  );
  return details.map(mapReportTemplate);
}

export async function getReportTemplate(templateId: string) {
  return mapReportTemplate(await requestJson<ReportTemplateDetailApi>(`/report-templates/${templateId}`));
}

export async function createReportTemplate(template: ReportTemplate) {
  const detail = await requestJson<ReportTemplateDetailApi>('/report-templates', {
    method: 'POST',
    body: JSON.stringify(mapReportTemplatePayload(template)),
  });
  return mapReportTemplate(detail);
}

export async function updateReportTemplate(template: ReportTemplate) {
  const detail = await requestJson<ReportTemplateDetailApi>(`/report-templates/${template.id}`, {
    method: 'PUT',
    body: JSON.stringify(mapReportTemplatePayload(template)),
  });
  return mapReportTemplate(detail);
}

export async function deleteReportTemplate(templateId: string) {
  await requestJson<{ success: boolean; message: string }>(`/report-templates/${templateId}`, {
    method: 'DELETE',
  });
}

export function listPptTemplates() {
  return requestJson<PptTemplateListItemApi[]>('/ppt-templates');
}

export function getPptTemplate(templateId: string) {
  return requestJson<PptTemplateDetailApi>(`/ppt-templates/${templateId}`);
}

export function createPptTemplate(payload: PptTemplatePayloadApi) {
  return requestJson<PptTemplateDetailApi>('/ppt-templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePptTemplate(templateId: string, payload: PptTemplatePayloadApi) {
  return requestJson<PptTemplateDetailApi>(`/ppt-templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePptTemplate(templateId: string) {
  await requestJson<{ success: boolean; message: string }>(`/ppt-templates/${templateId}`, {
    method: 'DELETE',
  });
}

export function listProjects() {
  return requestJson<ProjectListItemApi[]>('/projects');
}

export function getProject(projectId: string) {
  return requestJson<ProjectDetailApi>(`/projects/${projectId}`);
}

export function createProject(payload: ProjectPayloadApi) {
  return requestJson<ProjectDetailApi>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProject(projectId: string, payload: ProjectPayloadApi) {
  return requestJson<ProjectDetailApi>(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(projectId: string) {
  await requestJson<{ success: boolean; message: string }>(`/projects/${projectId}`, {
    method: 'DELETE',
  });
}

export function listHistories() {
  return requestJson<GenerationHistoryListItemApi[]>('/histories');
}

export function getHistoryEntry(historyId: string) {
  return requestJson<GenerationHistoryDetailApi>(`/histories/${historyId}`);
}

export function createHistoryEntry(payload: GenerationHistoryPayloadApi) {
  return requestJson<GenerationHistoryDetailApi>('/histories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateHistoryEntry(historyId: string, payload: GenerationHistoryPayloadApi) {
  return requestJson<GenerationHistoryDetailApi>(`/histories/${historyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteHistoryEntry(historyId: string) {
  await requestJson<{ success: boolean; message: string }>(`/histories/${historyId}`, {
    method: 'DELETE',
  });
}

export async function uploadFile(file: File, category: 'project' | 'template' | 'student', description = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('description', description);

  return requestJson<UploadedFileApi>('/uploads', {
    method: 'POST',
    body: formData,
  });
}
