export type TabKey = 'workbench' | 'templates' | 'data' | 'history';

export interface Metric {
  label: string;
  value: string;
  detail: string;
  accent: 'ink' | 'emerald' | 'amber' | 'azure';
}

export interface GenerationMode {
  id: 'topic' | 'upload' | 'outline';
  label: string;
  helper: string;
}

export interface QueueItem {
  studentName: string;
  templateName: string;
  eta: string;
  status: string;
  progress: number;
}

export interface OutlineBlock {
  title: string;
  description: string;
  slideHint: string;
  emphasis: string;
}

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  slides: number;
  usageCount: number;
  colorA: string;
  colorB: string;
  premium?: boolean;
}

export interface ModuleItem {
  name: string;
  description: string;
  recommendedSlides: string;
}

export interface ReportTemplateSection {
  id: string;
  title: string;
  summary: string;
  contentPoints: string[];
  dataBindings: string[];
  recommendedPages: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: '结业报告' | '学业规划' | string;
  scene: string;
  updatedAt: string;
  status: 'draft' | 'published' | string;
  sections: ReportTemplateSection[];
}

export interface DataSource {
  name: string;
  description: string;
  status: string;
  syncedAt: string;
  coverage: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  grade: string;
  className: string;
  courses: string;
  score: number;
  homework: number;
  attendance: number;
  reportStatus: string;
  teacherNote: string;
}

export interface ImportRecord {
  source: string;
  status: string;
  count: string;
  updatedAt: string;
}

export interface HistoryRecord {
  id: string;
  title: string;
  template: string;
  format: string;
  createdAt: string;
  students: string;
  status: string;
  owner: string;
  lastAction: string;
  notes: string;
}

export interface WorkbenchData {
  heroTips: string[];
  modes: GenerationMode[];
  summary: Metric[];
  queue: QueueItem[];
  outline: OutlineBlock[];
  suggestedTemplates: TemplateItem[];
}

export interface TemplateCenterData {
  categories: string[];
  featured: TemplateItem;
  templates: TemplateItem[];
  modules: ModuleItem[];
  reportTemplates: ReportTemplate[];
}

export interface DataManagementData {
  stats: Metric[];
  sources: DataSource[];
  students: StudentRecord[];
  imports: ImportRecord[];
  warnings: string[];
}

export interface HistoryData {
  stats: Metric[];
  records: HistoryRecord[];
}

export interface AppData {
  workbench: WorkbenchData;
  templateCenter: TemplateCenterData;
  dataManagement: DataManagementData;
  history: HistoryData;
}
