import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import {
  applyLlmChapterBindings,
  createProject,
  deleteProject,
  generateProjectPpt,
  getProject,
  listPptTemplates,
  listProjects,
  updateProject,
  uploadFile,
  type GenerationChapterLogBriefApi,
  type PptTemplateListItemApi,
  type ProjectDetailApi,
  type ProjectListItemApi,
  type ProjectPageApi,
} from '../services/api';
import type { ReportTemplate, StudentRecord, TabKey, WorkbenchData } from '../types';

interface WorkbenchViewProps {
  data: WorkbenchData;
  students: StudentRecord[];
  reportTemplates: ReportTemplate[];
  onNavigate: (tab: TabKey) => void;
  onRefresh: () => void;
}

type WorkspaceMode = 'entry' | 'editor';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface UploadDraft {
  pageId: string;
  description: string;
  files: File[];
}

const reportTypes = ['结业报告', '学业规划'] as const;

function buildAssistantReply(content: string) {
  if (content.includes('成绩') || content.includes('数据')) return '我会优先调整这一章的数据呈现和说明结构。';
  if (content.includes('家长') || content.includes('评语')) return '我会把家长沟通语气收得更自然一些，并同步更新对应章节。';
  if (content.includes('模板')) return '可以，我会保留当前大纲，只切换成新的 PPT 模板。';
  return '已记录这条修改要求，接下来会按当前章节结构继续整理内容。';
}

function createPagesFromTemplate(reportTemplate: ReportTemplate | null, data: WorkbenchData): ProjectPageApi[] {
  if (reportTemplate?.sections.length) {
    return reportTemplate.sections.map((section, index) => ({
      page_order: index + 1,
      title: section.title,
      description: section.summary,
      slide_hint: section.recommendedPages || '1-2 页',
      manual_text: '',
      bindings: [
        {
          binding_group: '章节数据',
          field_name: section.dataBindings.join('、') || '待补充字段',
          field_order: 1,
        },
      ],
      files: [],
    }));
  }

  return data.outline.map((item, index) => ({
    page_order: index + 1,
    title: item.title,
    description: item.description,
    slide_hint: item.slideHint,
    manual_text: '',
    bindings: item.emphasis
      ? [{ binding_group: '章节数据', field_name: item.emphasis, field_order: 1 }]
      : [],
    files: [],
  }));
}

function normalizeProject(project: ProjectDetailApi): ProjectDetailApi {
  return {
    ...project,
    pages: [...project.pages].sort((a, b) => a.page_order - b.page_order),
    messages: [...project.messages].sort((a, b) => {
      const left = a.created_at ? new Date(a.created_at).getTime() : 0;
      const right = b.created_at ? new Date(b.created_at).getTime() : 0;
      return left - right;
    }),
  };
}

function toProjectPayload(project: ProjectDetailApi) {
  return {
    student_id: project.student_id ?? null,
    report_type: project.report_type,
    report_template_id: project.report_template_id ?? null,
    ppt_template_id: project.ppt_template_id ?? null,
    prompt: project.prompt ?? null,
    status: project.status,
    pages: project.pages.map((page, index) => ({
      id: page.id ?? null,
      page_order: index + 1,
      title: page.title ?? '',
      description: page.description ?? '',
      slide_hint: page.slide_hint ?? '',
      manual_text: page.manual_text ?? '',
      bindings: page.bindings.map((binding, bindingIndex) => ({
        id: binding.id ?? null,
        binding_group: binding.binding_group,
        field_name: binding.field_name,
        field_order: binding.field_order ?? bindingIndex + 1,
      })),
      files: page.files.map((file) => ({
        id: file.id ?? null,
        file_name: file.file_name,
        file_type: file.file_type ?? null,
        mime_type: file.mime_type ?? null,
        file_path: file.file_path,
        file_size: file.file_size ?? null,
        description: file.description ?? null,
        created_at: file.created_at ?? null,
      })),
    })),
    messages: project.messages.map((message) => ({
      id: message.id ?? null,
      role: message.role,
      content: message.content,
      created_at: message.created_at ?? null,
    })),
  };
}

function parseFieldInput(value: string) {
  return value
    .split(/\r?\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** 只更新某一 binding_group，保留其它分组，避免多行编辑时整页 bindings 被覆盖导致跳动或丢数据 */
function replaceBindingGroup(
  bindings: ProjectPageApi['bindings'],
  groupName: string,
  fieldNames: string[],
): ProjectPageApi['bindings'] {
  const gn = groupName || '章节数据';
  let inserted = false;
  const next: ProjectPageApi['bindings'] = [];
  for (const b of bindings) {
    const g = b.binding_group || '章节数据';
    if (g === gn) {
      if (!inserted) {
        fieldNames.forEach((fieldName, index) => {
          next.push({
            id: null,
            binding_group: gn,
            field_name: fieldName,
            field_order: index + 1,
          });
        });
        inserted = true;
      }
      continue;
    }
    next.push(b);
  }
  if (!inserted) {
    fieldNames.forEach((fieldName, index) => {
      next.push({
        id: null,
        binding_group: gn,
        field_name: fieldName,
        field_order: index + 1,
      });
    });
  }
  return next;
}

function countMountedItems(page: ProjectPageApi) {
  return page.bindings.length + page.files.length + (page.manual_text?.trim() ? 1 : 0);
}

export function WorkbenchView({ data, students, reportTemplates, onNavigate, onRefresh }: WorkbenchViewProps) {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('entry');
  const [prompt, setPrompt] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<(typeof reportTypes)[number]>(reportTypes[0]);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? '');
  const [project, setProject] = useState<ProjectDetailApi | null>(null);
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [pptTemplates, setPptTemplates] = useState<PptTemplateListItemApi[]>([]);
  const [recentProjects, setRecentProjects] = useState<ProjectListItemApi[]>([]);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('全部');
  const [uploadDraft, setUploadDraft] = useState<UploadDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [generationLogs, setGenerationLogs] = useState<GenerationChapterLogBriefApi[]>([]);
  const lastSavedSnapshotRef = useRef('');
  const autoSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!students.length) {
      setSelectedStudentId('');
      return;
    }
    if (!students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  const loadAuxiliary = async () => {
    const [templates, projects] = await Promise.all([listPptTemplates(), listProjects()]);
    setPptTemplates(templates);
    setRecentProjects(projects.slice(0, 5));
  };

  useEffect(() => {
    void loadAuxiliary();
  }, []);

  useEffect(() => {
    if (!project) return;
    const snapshot = JSON.stringify(toProjectPayload(project));
    if (snapshot === lastSavedSnapshotRef.current) return;
    if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    setSaveState('saving');
    autoSaveTimerRef.current = window.setTimeout(async () => {
      try {
        await updateProject(project.id, toProjectPayload(project));
        lastSavedSnapshotRef.current = snapshot;
        setSaveState('saved');
        await loadAuxiliary();
      } catch {
        setSaveState('error');
      }
    }, 600);
    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [project]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const selectedTemplate = pptTemplates.find((template) => template.id === project?.ppt_template_id) ?? null;
  const templateCategories = useMemo(() => {
    const set = new Set<string>(['全部']);
    pptTemplates.forEach((template) => {
      if (template.category?.trim()) {
        set.add(template.category.trim());
      }
    });
    return [...set];
  }, [pptTemplates]);
  const filteredTemplates = useMemo(() => {
    const keyword = templateSearch.trim().toLowerCase();
    return pptTemplates.filter((template) => {
      const categoryOk = templateCategory === '全部' || (template.category ?? '未分类') === templateCategory;
      if (!categoryOk) return false;
      if (!keyword) return true;
      return [template.name, template.category ?? '', template.source_file_name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [pptTemplates, templateCategory, templateSearch]);
  const uploadTargetPage = useMemo(
    () => project?.pages.find((page) => (page.id ?? String(page.page_order)) === uploadDraft?.pageId) ?? null,
    [project, uploadDraft],
  );

  const updateProjectDraft = (updater: (current: ProjectDetailApi) => ProjectDetailApi) => {
    setProject((current) => (current ? normalizeProject(updater(current)) : current));
  };

  const updatePage = (pageId: string, updater: (page: ProjectPageApi) => ProjectPageApi) => {
    updateProjectDraft((current) => ({
      ...current,
      pages: current.pages.map((page) => ((page.id ?? String(page.page_order)) === pageId ? updater(page) : page)),
    }));
  };

  const openProject = async (projectId: string) => {
    setIsSubmitting(true);
    try {
      const detail = normalizeProject(await getProject(projectId));
      setProject(detail);
      setSelectedStudentId(detail.student_id ?? '');
      setSelectedReportType((detail.report_type as (typeof reportTypes)[number]) ?? reportTypes[0]);
      setPrompt(detail.prompt ?? '');
      setWorkspaceMode('editor');
      setExpandedPageId(null);
      lastSavedSnapshotRef.current = JSON.stringify(toProjectPayload(detail));
      setSaveState('saved');
      setStatusMessage('');
      setGenerationLogs([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async () => {
    setIsSubmitting(true);
    try {
      const reportTemplate =
        reportTemplates.find((template) => template.reportType === selectedReportType) ?? reportTemplates[0] ?? null;
      const created = normalizeProject(
        await createProject({
          student_id: selectedStudentId || null,
          report_type: selectedReportType,
          report_template_id: reportTemplate?.id ?? null,
          ppt_template_id: null,
          prompt: prompt.trim() || null,
          status: 'draft',
          pages: createPagesFromTemplate(reportTemplate, data),
          messages: [
            { role: 'user', content: prompt.trim() || `开始生成${selectedReportType}` },
            {
              role: 'assistant',
              content: selectedStudent
                ? `已根据 ${selectedStudent.name} 的数据生成章节草稿，可以继续补充章节数据。`
                : '已创建空白大纲草稿，你可以先录入学生数据再继续制作。',
            },
          ],
        }),
      );
      setProject(created);
      setWorkspaceMode('editor');
      setExpandedPageId(null);
      lastSavedSnapshotRef.current = JSON.stringify(toProjectPayload(created));
      setSaveState('saved');
      setStatusMessage('');
      setGenerationLogs([]);
      await loadAuxiliary();
      onRefresh();

      if (selectedStudentId) {
        setStatusMessage('正在由大模型匹配各章节应挂载的数据字段…');
        try {
          const bindingResult = await applyLlmChapterBindings(created.id);
          const merged = normalizeProject(bindingResult.project);
          setProject(merged);
          lastSavedSnapshotRef.current = JSON.stringify(toProjectPayload(merged));
          setSaveState('saved');
          await loadAuxiliary();
          onRefresh();
          setStatusMessage(bindingResult.skipped_reason ?? '');
        } catch (err) {
          setStatusMessage(err instanceof Error ? err.message : '大模型挂载失败，请检查 DASHSCOPE_API_KEY 或稍后重试。');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const flushProject = async () => {
    if (!project) return null;
    const snapshot = JSON.stringify(toProjectPayload(project));
    if (snapshot === lastSavedSnapshotRef.current) return project;
    const saved = await updateProject(project.id, toProjectPayload(project));
    lastSavedSnapshotRef.current = JSON.stringify(toProjectPayload(saved));
    setSaveState('saved');
    return normalizeProject(saved);
  };

  const handleDeleteCurrentProject = async () => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      await deleteProject(project.id);
      setProject(null);
      setWorkspaceMode('entry');
      setExpandedPageId(null);
      setStatusMessage('');
      await loadAuxiliary();
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitChat = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !project) return;
    updateProjectDraft((current) => ({
      ...current,
      messages: [...current.messages, { role: 'user', content: trimmed }, { role: 'assistant', content: buildAssistantReply(trimmed) }],
    }));
    setChatInput('');
  };

  const handleStartMaking = async () => {
    if (!project) return;
    setIsSubmitting(true);
    try {
      const synced = await flushProject();
      if (!synced) return;
      setStatusMessage('正在按章节生成 PPT，请稍候…');
      const result = await generateProjectPpt(synced.id);
      updateProjectDraft((current) => ({
        ...current,
        status: result.status,
        messages: [...current.messages, { role: 'assistant', content: `生成完成：${result.output_file_name}（${result.slide_count} 页）` }],
      }));
      setGenerationLogs(result.chapter_log_items ?? []);
      setStatusMessage(`生成完成：${result.output_file_name}`);
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadConfirm = async () => {
    if (!uploadDraft || !uploadDraft.files.length) return;
    setIsSubmitting(true);
    try {
      const uploaded = await Promise.all(uploadDraft.files.map((file) => uploadFile(file, 'project', uploadDraft.description.trim())));
      updatePage(uploadDraft.pageId, (page) => ({
        ...page,
        files: [
          ...page.files,
          ...uploaded.map((item) => ({
            file_name: item.file_name,
            file_type: item.file_type ?? null,
            mime_type: item.mime_type ?? null,
            file_path: item.file_path,
            file_size: item.file_size,
            description: item.description ?? null,
            created_at: item.created_at,
          })),
        ],
      }));
      setUploadDraft(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (workspaceMode === 'entry') {
    return (
      <section className="page-panel workbench-entry-shell">
        <article className="hero-surface workbench-entry">
          <div className="workbench-core-head">
            <div className="workbench-core-copy">
              <span className="entry-kicker">生成工作台</span>
              <h1 className="hero-title entry-hero-title">生成可编辑的 PPT 报告草稿</h1>
              <p className="hero-subtitle entry-hero-subtitle">选择对象与类型后，直接输入生成要求并开始制作。</p>
            </div>
            {recentProjects.length > 0 ? (
              <button type="button" className="soft-button" onClick={() => void openProject(recentProjects[0].id)} disabled={isSubmitting}>
                继续最近草稿
              </button>
            ) : null}
          </div>

          <div className="workbench-core-config">
            <label className="entry-select-field">
              <span>报告类型</span>
              <select value={selectedReportType} onChange={(event) => setSelectedReportType(event.target.value as (typeof reportTypes)[number])}>
                {reportTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="entry-select-field">
              <span>学生对象</span>
              <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                {students.length ? students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>) : <option value="">暂无学生数据</option>}
              </select>
            </label>
            <div className="workbench-core-status">
              <span>当前状态</span>
              <strong>{students.length ? `${students.length} 名学生数据可用` : '请先录入学生数据'}</strong>
            </div>
          </div>

          <div className="studio-prompt-shell entry-composer">
            <div className="entry-panel-head">
              <div>
                <strong>生成要求</strong>
                <span>只保留核心输入区域，直接描述你想突出的内容重点</span>
              </div>
            </div>
            <textarea className="studio-prompt-input" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="例如：生成本学期结业报告，突出成绩走势、课堂表现和家长沟通建议，整体风格更正式专业。" />
            <div className="studio-prompt-footer">
              <div className="quick-chip-list align-left">
                {!students.length ? <button type="button" className="ghost-pill" onClick={() => onNavigate('data')}>去录入学生数据</button> : null}
                <button type="button" className="soft-button" onClick={() => onNavigate('templates')}>查看模板中心</button>
              </div>
              <button type="button" className="accent-button studio-submit-button" onClick={() => void handleCreateProject()} disabled={isSubmitting}>
                开始生成
                <Icon name="arrowRight" className="button-icon" />
              </button>
            </div>
          </div>
        </article>
      </section>
    );
  }

  if (!project) return null;

  return (
    <section className="page-panel studio-shell workbench-editor-shell">
      <div className="studio-main">
        <div className="studio-header">
          <div className="studio-header-main">
            <div className="studio-title">
              <div>
                <strong>PPT 大纲编辑区</strong>
                <span>{selectedStudent ? `${selectedStudent.name} · ${project.report_type}` : project.report_type} · {saveState === 'saving' ? '正在保存' : saveState === 'saved' ? '已自动保存' : saveState === 'error' ? '保存失败' : '草稿状态'}</span>
              </div>
            </div>
            <div className="studio-meta-row">
              <span className="studio-meta-pill">章节 {project.pages.length}</span>
              <span className="studio-meta-pill">消息 {project.messages.length}</span>
              {selectedTemplate ? <span className="studio-meta-pill">模板已选</span> : <span className="studio-meta-pill is-muted">待选模板</span>}
            </div>
          </div>
          <div className="studio-header-actions">
            <button type="button" className="soft-button" onClick={() => setWorkspaceMode('entry')}>返回</button>
            <button type="button" className="soft-button" onClick={() => void handleDeleteCurrentProject()} disabled={isSubmitting}>删除草稿</button>
          </div>
        </div>
        <div className="studio-scroll">
          <div className="workbench-section-head">
            <div>
              <strong>章节编辑区</strong>
              <span>{selectedTemplate ? `当前模板：${selectedTemplate.name}` : '请先选择 PPT 模板'}，逐页补充说明、数据字段与附件素材</span>
            </div>
          </div>
          <div className="presentation-stack">
            {project.pages.map((page) => {
              const pageId = page.id ?? String(page.page_order);
              const grouped = page.bindings.reduce<Record<string, string[]>>((acc, binding) => {
                const key = binding.binding_group || '章节数据';
                acc[key] = acc[key] ?? [];
                acc[key].push(binding.field_name);
                return acc;
              }, {});
              return (
                <article key={pageId} className={`presentation-page ${expandedPageId === pageId ? 'is-expanded' : ''}`}>
                  <div className="presentation-page-frame">
                    <div className="presentation-page-head">
                      <span className="presentation-page-order">{page.page_order}</span>
                      <div className="presentation-page-title-block">
                        <strong>{page.title || `章节 ${page.page_order}`}</strong>
                        <p>{page.description || '本章节暂无说明'}</p>
                      </div>
                    </div>
                    <div className="presentation-page-body compact">
                      <div className="page-card-meta">
                        <div className="page-card-stat"><span>页数建议</span><strong>{page.slide_hint || '-'}</strong></div>
                        <div className="page-card-stat"><span>数据字段</span><strong>{page.bindings.length}</strong></div>
                        <div className="page-card-stat"><span>已挂载项</span><strong>{countMountedItems(page)}</strong></div>
                      </div>
                      <div className="page-binding-chip-row">
                        {Object.keys(grouped).length ? Object.keys(grouped).map((key) => <span key={`${pageId}-${key}`} className="page-binding-chip">{key}</span>) : <span className="page-binding-chip">未挂载数据</span>}
                      </div>
                      <div className="page-card-actions">
                        <button type="button" className="page-mini-button" onClick={() => setExpandedPageId((current) => current === pageId ? null : pageId)}>{expandedPageId === pageId ? '收起' : '展开编辑'}</button>
                        <button type="button" className="page-mini-button" onClick={() => setUploadDraft({ pageId, description: '', files: [] })}>上传文件</button>
                      </div>
                      {expandedPageId === pageId ? (
                        <div className="page-card-detail">
                          <div className="page-editor-block">
                            <span className="page-editor-label">章节说明</span>
                            <textarea className="presentation-outline-input is-compact" value={page.description ?? ''} onChange={(event) => updatePage(pageId, (current) => ({ ...current, description: event.target.value }))} />
                          </div>
                          <div className="presentation-binding-panel compact">
                            {Object.entries(grouped).map(([groupName, fields]) => (
                              <label key={`${pageId}-${groupName}`} className="presentation-binding-row is-editable">
                                <span>{groupName}</span>
                                <textarea
                                  className="binding-editor"
                                  rows={3}
                                  value={fields.join('\n')}
                                  onChange={(event) =>
                                    updatePage(pageId, (current) => ({
                                      ...current,
                                      bindings: replaceBindingGroup(current.bindings, groupName, parseFieldInput(event.target.value)),
                                    }))
                                  }
                                />
                              </label>
                            ))}
                          </div>
                          <div className="page-editor-block">
                            <span className="page-editor-label">补充文本</span>
                            <textarea className="page-manual-editor" rows={4} value={page.manual_text ?? ''} onChange={(event) => updatePage(pageId, (current) => ({ ...current, manual_text: event.target.value }))} />
                          </div>
                          <div className="page-asset-list is-compact">
                            {page.files.length ? page.files.map((file, index) => (
                              <article key={`${pageId}-${file.file_path}-${index}`} className="page-asset-card compact">
                                <div className="page-asset-meta">
                                  <strong>{file.file_name}</strong>
                                  <span>{file.file_type || 'file'}{file.description ? ` · ${file.description}` : ''}</span>
                                  <p>{file.file_path}</p>
                                </div>
                              </article>
                            )) : <div className="report-template-empty">暂无素材</div>}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <div className="studio-footer">
          <div className="studio-footer-copy">
            {selectedTemplate ? <strong className="studio-template-badge">已选模板：{selectedTemplate.name}</strong> : <span>请先选择 PPT 模板</span>}
            {statusMessage ? <span>{statusMessage}</span> : null}
            {generationLogs.length ? (
              <div className="generation-log-list">
                {generationLogs.map((log) => (
                  <div key={`${log.chapter_order}-${log.template_section_index}`} className="generation-log-item">
                    <span>
                      章节{log.chapter_order} · 模板段{log.template_section_index} · LLM命中{log.llm_hit_count} · 回退{log.fallback_count}
                    </span>
                    {log.status !== 'completed' ? (
                      <button type="button" className="soft-button" onClick={() => void handleStartMaking()} disabled={isSubmitting}>
                        重试该章节
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="studio-footer-actions">
            <button type="button" className="accent-button" onClick={() => selectedTemplate ? void handleStartMaking() : setIsTemplatePickerOpen(true)} disabled={isSubmitting}>{selectedTemplate ? '开始制作' : '选择模板'}</button>
          </div>
        </div>
      </div>
      <aside className="studio-chat">
        <div className="studio-chat-header">
          <strong>AI 协同修改</strong>
          <p>围绕当前草稿继续提要求，系统会把修改意见同步到编辑流程里。</p>
        </div>
        <div className="studio-chat-scroll">
          <div className="studio-chat-messages">
            {project.messages.map((message, index) => <article key={`${message.role}-${message.created_at ?? index}-${index}`} className={`studio-chat-message is-${message.role}`}><p>{message.content}</p></article>)}
          </div>
        </div>
        <div className="studio-chat-footer">
          <div className="studio-chat-suggestions">
            <button type="button" className="suggestion-chip" onClick={() => handleSubmitChat('细化成绩趋势分析部分')}>细化成绩趋势</button>
            <button type="button" className="suggestion-chip" onClick={() => handleSubmitChat('补充家长沟通建议')}>补充家长沟通</button>
            <button type="button" className="suggestion-chip" onClick={() => setIsTemplatePickerOpen(true)}>重新选择模板</button>
          </div>
          <div className="studio-chat-input-shell">
            <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="输入你的修改要求" rows={3} />
            <button type="button" className="studio-chat-send" onClick={() => handleSubmitChat(chatInput)}><Icon name="arrowRight" className="button-icon" /></button>
          </div>
        </div>
      </aside>
      {uploadDraft ? (
        <div className="modal-backdrop" onClick={() => setUploadDraft(null)}>
          <div className="modal-panel upload-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head"><strong>上传文件</strong><button type="button" className="modal-close" onClick={() => setUploadDraft(null)}>×</button></div>
            <div className="upload-modal-body">
              <p>{uploadTargetPage ? `当前章节：${uploadTargetPage.title || `章节 ${uploadTargetPage.page_order}`}` : '请选择章节'}</p>
              <label className="report-template-field"><span>文件描述</span><input value={uploadDraft.description} onChange={(event) => setUploadDraft((current) => current ? { ...current, description: event.target.value } : current)} /></label>
              <label className="upload-picker">
                <input type="file" multiple accept="image/*,.txt,.md,.csv,.pdf" onChange={(event) => setUploadDraft((current) => current ? { ...current, files: Array.from(event.target.files ?? []) } : current)} />
                <span>{uploadDraft.files.length ? `已选 ${uploadDraft.files.length} 个文件` : '选择文件'}</span>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="soft-button" onClick={() => setUploadDraft(null)}>取消</button>
              <button type="button" className="accent-button" onClick={() => void handleUploadConfirm()} disabled={isSubmitting}>确认上传</button>
            </div>
          </div>
        </div>
      ) : null}
      {isTemplatePickerOpen ? (
        <div className="modal-backdrop" onClick={() => setIsTemplatePickerOpen(false)}>
          <div className="modal-panel template-picker-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head"><strong>选择 PPT 模板</strong><button type="button" className="modal-close" onClick={() => setIsTemplatePickerOpen(false)}>×</button></div>
            <div className="template-picker-toolbar">
              <label className="template-picker-search">
                <input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="搜索模板名称或文件名" />
              </label>
              <div className="template-picker-filter-strip">
                {templateCategories.map((category) => (
                  <button key={category} type="button" className={`ghost-pill ${templateCategory === category ? 'is-selected' : ''}`} onClick={() => setTemplateCategory(category)}>
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="template-picker-grid">
              {filteredTemplates.map((template) => (
                <button key={template.id} type="button" className={`template-picker-card ${project.ppt_template_id === template.id ? 'is-active' : ''}`} onClick={() => { updateProjectDraft((current) => ({ ...current, ppt_template_id: template.id })); setIsTemplatePickerOpen(false); }}>
                  <div className="template-picker-cover" style={{ background: 'linear-gradient(135deg, #f8fafc, #eef3f8)' }} />
                  <div className="template-picker-meta"><strong>{template.name}</strong><span>{template.page_count} 页 · {template.category ?? '未分类'} · {template.parse_status}</span></div>
                </button>
              ))}
              {filteredTemplates.length === 0 ? <div className="report-template-empty"><span>没有匹配的 PPT 模板</span><button type="button" className="soft-button" onClick={() => onNavigate('templates')}>去模板中心</button></div> : null}
            </div>
          </div>
        </div>
      ) : null}
      <button type="button" className="workbench-fab" onClick={() => setIsTemplatePickerOpen(true)} aria-label="打开模板配置">
        <Icon name="spark" className="button-icon" />
      </button>
    </section>
  );
}
