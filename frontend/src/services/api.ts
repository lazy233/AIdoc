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

interface ReportTemplateSectionDetailApi {
  id: string;
  section_order: number;
  title: string;
  summary?: string | null;
  content_points: string[];
  data_bindings: string[];
  recommended_pages?: string | null;
}

interface ReportTemplateDetailApi {
  id: string;
  name: string;
  report_type: string;
  status: string;
  sections: ReportTemplateSectionDetailApi[];
  created_at: string;
  updated_at: string;
}

interface ReportTemplatePayloadApi {
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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function mapReportTemplate(detail: ReportTemplateDetailApi): ReportTemplate {
  return {
    id: detail.id,
    name: detail.name,
    description: '',
    reportType: detail.report_type as ReportTemplate['reportType'],
    scene: '',
    updatedAt: detail.updated_at,
    status: detail.status as ReportTemplate['status'],
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
  const templates = await requestJson<Array<{ id: string }>>('/report-templates');
  const details = await Promise.all(templates.map((template) => requestJson<ReportTemplateDetailApi>(`/report-templates/${template.id}`)));
  return details.map(mapReportTemplate);
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
