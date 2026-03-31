import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import type { StudentRecord, TabKey, TemplateItem, WorkbenchData } from '../types';

interface WorkbenchViewProps {
  data: WorkbenchData;
  students: StudentRecord[];
  onNavigate: (tab: TabKey) => void;
}

type WorkspaceMode = 'entry' | 'editor';
type ChatRole = 'user' | 'assistant';
type PageAssetKind = 'image' | 'text';

interface PageBindingGroup {
  section: string;
  fields: string[];
}

interface PageAsset {
  id: string;
  kind: PageAssetKind;
  name: string;
  sizeLabel: string;
  description: string;
  previewUrl?: string;
  textContent?: string;
}

interface PresentationPage {
  id: string;
  order: number;
  title: string;
  description: string;
  slideHint: string;
  bindings: PageBindingGroup[];
  manualText: string;
  assets: PageAsset[];
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

interface UploadDraft {
  pageId: string;
  description: string;
  files: File[];
}

const reportTypes = ['结业报告', '学业规划'] as const;

function createInitialPages(data: WorkbenchData): PresentationPage[] {
  return data.outline.map((item, index) => ({
    id: `page-${index + 1}`,
    order: index + 1,
    title: item.title,
    description: item.description,
    slideHint: item.slideHint,
    bindings: item.emphasis
      ? [
          {
            section: '章节数据',
            fields: [item.emphasis],
          },
        ]
      : [],
    manualText: '',
    assets: [],
  }));
}

function buildAssistantReply(content: string) {
  if (content.includes('模板')) {
    return '可以，我会在当前章节结构上切换到所选模板。';
  }

  if (content.includes('成绩') || content.includes('数据')) {
    return '可以，我会优先优化这一部分的数据呈现。';
  }

  return '已收到修改要求，你可以继续指定某个章节或某页内容。';
}

function parseFieldInput(value: string) {
  return value
    .split(/\r?\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function createAssetId() {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function countMountedItems(page: PresentationPage) {
  const bindingCount = page.bindings.reduce((total, group) => total + group.fields.length, 0);
  return bindingCount + page.assets.length + (page.manualText.trim() ? 1 : 0);
}

export function WorkbenchView({ data, students, onNavigate }: WorkbenchViewProps) {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('entry');
  const [prompt, setPrompt] = useState('');
  const [selectedReportType, setSelectedReportType] = useState<(typeof reportTypes)[number]>(reportTypes[0]);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? '');
  const [pages, setPages] = useState<PresentationPage[]>(() => createInitialPages(data));
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你可以先整理章节数据，再选择 PPT 模板开始制作。',
    },
  ]);

  useEffect(() => {
    if (!students.length) {
      setSelectedStudentId('');
      return;
    }

    if (!students.some((item) => item.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  const selectedStudent = students.find((item) => item.id === selectedStudentId) ?? null;
  const selectedTemplate = data.suggestedTemplates.find((template) => template.id === selectedTemplateId) ?? null;
  const uploadTargetPage = useMemo(
    () => pages.find((page) => page.id === uploadDraft?.pageId) ?? null,
    [pages, uploadDraft],
  );

  const updatePage = (pageId: string, updater: (page: PresentationPage) => PresentationPage) => {
    setPages((current) => current.map((page) => (page.id === pageId ? updater(page) : page)));
  };

  const submitPrompt = () => {
    setWorkspaceMode('editor');
    setPages(createInitialPages(data));
    setExpandedPageId(null);
    setSelectedTemplateId(null);
    setChatMessages([
      { id: 'prompt-user', role: 'user', content: prompt || '开始生成报告大纲' },
      {
        id: 'prompt-assistant',
        role: 'assistant',
        content: selectedStudent
          ? `已根据 ${selectedStudent.name} 的真实数据生成章节草稿。`
          : '已进入制作阶段。当前没有可用学生数据，可以先去数据管理页面补录。',
      },
    ]);
  };

  const submitChat = (content: string) => {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    setChatMessages((messages) => [
      ...messages,
      { id: `user-${messages.length + 1}`, role: 'user', content: trimmed },
      { id: `assistant-${messages.length + 2}`, role: 'assistant', content: buildAssistantReply(trimmed) },
    ]);
    setChatInput('');
  };

  const handleBindingChange = (pageId: string, section: string, value: string) => {
    updatePage(pageId, (page) => ({
      ...page,
      bindings: page.bindings.map((group) =>
        group.section === section
          ? {
              ...group,
              fields: parseFieldInput(value),
            }
          : group,
      ),
    }));
  };

  const openUploadModal = (pageId: string) => {
    setUploadDraft({
      pageId,
      description: '',
      files: [],
    });
  };

  const closeUploadModal = () => {
    setUploadDraft(null);
  };

  const handleUploadConfirm = async () => {
    if (!uploadDraft || !uploadDraft.files.length) {
      return;
    }

    const uploads = await Promise.all(
      uploadDraft.files.map(async (file) => {
        if (file.type.startsWith('image/')) {
          return {
            id: createAssetId(),
            kind: 'image' as const,
            name: file.name,
            sizeLabel: formatFileSize(file.size),
            description: uploadDraft.description.trim(),
            previewUrl: URL.createObjectURL(file),
          };
        }

        let textContent = '';

        try {
          textContent = (await file.text()).trim().slice(0, 180);
        } catch {
          textContent = '';
        }

        return {
          id: createAssetId(),
          kind: 'text' as const,
          name: file.name,
          sizeLabel: formatFileSize(file.size),
          description: uploadDraft.description.trim(),
          textContent,
        };
      }),
    );

    updatePage(uploadDraft.pageId, (page) => ({
      ...page,
      assets: [...page.assets, ...uploads],
    }));
    closeUploadModal();
  };

  if (workspaceMode === 'entry') {
    return (
      <section className="page-panel workbench-entry-shell">
        <article className="hero-surface workbench-entry">
          <h1 className="hero-title entry-hero-title">AI文档生成</h1>

          <div className="entry-select-panel">
            <div className="entry-select-grid">
              <label className="entry-select-field">
                <span>选择报告类型</span>
                <select value={selectedReportType} onChange={(event) => setSelectedReportType(event.target.value as (typeof reportTypes)[number])}>
                  {reportTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="entry-select-field">
                <span>选择学生</span>
                <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                  {students.length ? (
                    students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))
                  ) : (
                    <option value="">暂无学生数据</option>
                  )}
                </select>
              </label>
            </div>
          </div>

          <div className="studio-prompt-shell entry-composer">
            <textarea
              className="studio-prompt-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="输入需求，例如：生成本学期结业报告，突出学习表现和家长沟通建议"
            />
            <div className="studio-prompt-footer">
              <div className="quick-chip-list">
                {data.heroTips.map((tip) => (
                  <button key={tip} type="button" className="ghost-pill" onClick={() => setPrompt(tip)}>
                    {tip}
                  </button>
                ))}
                {!students.length ? (
                  <button type="button" className="ghost-pill" onClick={() => onNavigate('data')}>
                    去数据管理录入学生
                  </button>
                ) : null}
              </div>
              <button type="button" className="accent-button studio-submit-button" onClick={submitPrompt}>
                立即生成
                <Icon name="arrowRight" className="button-icon" />
              </button>
            </div>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-panel studio-shell workbench-editor-shell">
      <div className="studio-main">
        <div className="studio-header">
          <div className="studio-title">
            <div>
              <strong>PPT 大纲</strong>
              <span>{selectedStudent ? `${selectedStudent.name} · ${selectedReportType}` : '未选择学生'}</span>
            </div>
          </div>
          <div className="studio-footer-actions">
            <span className="studio-status">章节编辑</span>
            <button type="button" className="soft-button" onClick={() => setWorkspaceMode('entry')}>
              返回
            </button>
          </div>
        </div>

        <div className="studio-scroll">
          <div className="presentation-stack">
            {pages.length === 0 ? (
              <div className="report-template-empty">
                <span>当前没有可用章节，请先创建报告模板。</span>
                <button type="button" className="soft-button" onClick={() => onNavigate('templates')}>
                  去模板中心
                </button>
              </div>
            ) : (
              pages.map((page) => (
                <article key={page.id} className={`presentation-page ${expandedPageId === page.id ? 'is-expanded' : ''}`}>
                  <div className="presentation-page-frame">
                    <div className="presentation-page-head">
                      <span className="presentation-page-order">{page.order}</span>
                      <div className="presentation-page-title-block">
                        <strong>{page.title}</strong>
                        <p>{page.description || '本章节内容待补充'}</p>
                      </div>
                    </div>

                    <div className="presentation-page-body compact">
                      <div className="page-card-meta">
                        <div className="page-card-stat">
                          <span>页数建议</span>
                          <strong>{page.slideHint || '-'}</strong>
                        </div>
                        <div className="page-card-stat">
                          <span>挂载数据</span>
                          <strong>{page.bindings.reduce((total, group) => total + group.fields.length, 0)}</strong>
                        </div>
                        <div className="page-card-stat">
                          <span>已挂载项</span>
                          <strong>{countMountedItems(page)}</strong>
                        </div>
                      </div>

                      <div className="page-binding-chip-row">
                        {page.bindings.length === 0 ? (
                          <span className="page-binding-chip">未挂载数据</span>
                        ) : (
                          page.bindings.map((group) => (
                            <span key={`${page.id}-${group.section}`} className="page-binding-chip">
                              {group.section}
                            </span>
                          ))
                        )}
                      </div>

                      <div className="page-card-actions">
                        <button
                          type="button"
                          className="page-mini-button"
                          onClick={() => setExpandedPageId((current) => (current === page.id ? null : page.id))}
                        >
                          {expandedPageId === page.id ? '收起' : '展开编辑'}
                        </button>
                        <button type="button" className="page-mini-button" onClick={() => openUploadModal(page.id)}>
                          上传文件
                        </button>
                      </div>

                      {expandedPageId === page.id ? (
                        <div className="page-card-detail">
                          <div className="page-editor-block">
                            <span className="page-editor-label">章节说明</span>
                            <textarea
                              className="presentation-outline-input is-compact"
                              value={page.description}
                              onChange={(event) =>
                                updatePage(page.id, (current) => ({
                                  ...current,
                                  description: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="presentation-binding-panel compact">
                            {page.bindings.map((group) => (
                              <label key={`${page.id}-${group.section}-editor`} className="presentation-binding-row is-editable">
                                <span>{group.section}</span>
                                <textarea
                                  className="binding-editor"
                                  rows={3}
                                  value={group.fields.join('\n')}
                                  onChange={(event) => handleBindingChange(page.id, group.section, event.target.value)}
                                />
                              </label>
                            ))}
                          </div>

                          <div className="page-editor-block">
                            <span className="page-editor-label">补充文本</span>
                            <textarea
                              className="page-manual-editor"
                              rows={4}
                              value={page.manualText}
                              onChange={(event) =>
                                updatePage(page.id, (current) => ({
                                  ...current,
                                  manualText: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="page-asset-list is-compact">
                            {page.assets.map((asset) => (
                              <article key={asset.id} className="page-asset-card compact">
                                <div className="page-asset-meta">
                                  <strong>{asset.name}</strong>
                                  <span>
                                    {asset.sizeLabel}
                                    {asset.description ? ` · ${asset.description}` : ''}
                                  </span>
                                  <p>{asset.kind === 'text' ? asset.textContent || '文本文件已挂载' : '图片素材已上传'}</p>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="studio-footer">
          <div className="studio-footer-copy">
            {selectedTemplate ? <strong className="studio-template-badge">已选模板：{selectedTemplate.title}</strong> : <span>请先选择 PPT 模板</span>}
          </div>
          <div className="studio-footer-actions">
            <button
              type="button"
              className="accent-button"
              onClick={() => {
                if (selectedTemplate) {
                  submitChat('开始制作');
                  return;
                }

                setIsTemplatePickerOpen(true);
              }}
            >
              {selectedTemplate ? '开始制作' : '选择模板'}
            </button>
          </div>
        </div>
      </div>

      <aside className="studio-chat">
        <div className="studio-chat-header">
          <strong>与 AI 一起修改</strong>
        </div>

        <div className="studio-chat-scroll">
          <div className="studio-chat-messages">
            {chatMessages.map((message) => (
              <article key={message.id} className={`studio-chat-message is-${message.role}`}>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="studio-chat-footer">
          <div className="studio-chat-suggestions">
            <button type="button" className="suggestion-chip" onClick={() => submitChat('细化成绩趋势分析部分')}>
              细化成绩趋势
            </button>
            <button type="button" className="suggestion-chip" onClick={() => submitChat('补充家长沟通部分')}>
              补充家长沟通
            </button>
            <button type="button" className="suggestion-chip" onClick={() => setIsTemplatePickerOpen(true)}>
              重新选择模板
            </button>
          </div>

          <div className="studio-chat-input-shell">
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="输入你的修改要求"
              rows={3}
            />
            <button type="button" className="studio-chat-send" onClick={() => submitChat(chatInput)}>
              <Icon name="arrowRight" className="button-icon" />
            </button>
          </div>
        </div>
      </aside>

      {uploadDraft ? (
        <div className="modal-backdrop" onClick={closeUploadModal}>
          <div className="modal-panel upload-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <strong>上传文件</strong>
              <button type="button" className="modal-close" onClick={closeUploadModal}>
                ×
              </button>
            </div>
            <div className="upload-modal-body">
              <p>{uploadTargetPage ? `当前章节：${uploadTargetPage.title}` : '请选择章节'}</p>
              <label className="report-template-field">
                <span>文件描述</span>
                <input
                  value={uploadDraft.description}
                  onChange={(event) =>
                    setUploadDraft((current) => (current ? { ...current, description: event.target.value } : current))
                  }
                />
              </label>
              <label className="upload-picker">
                <input
                  type="file"
                  multiple
                  accept="image/*,.txt,.md,.csv"
                  onChange={(event) =>
                    setUploadDraft((current) =>
                      current ? { ...current, files: Array.from(event.target.files ?? []) } : current,
                    )
                  }
                />
                <span>{uploadDraft.files.length ? `已选 ${uploadDraft.files.length} 个文件` : '选择文件'}</span>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="soft-button" onClick={closeUploadModal}>
                取消
              </button>
              <button type="button" className="accent-button" onClick={handleUploadConfirm}>
                确认上传
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isTemplatePickerOpen ? (
        <div className="modal-backdrop" onClick={() => setIsTemplatePickerOpen(false)}>
          <div className="modal-panel template-picker-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <strong>选择 PPT 模板</strong>
              <button type="button" className="modal-close" onClick={() => setIsTemplatePickerOpen(false)}>
                ×
              </button>
            </div>
            <div className="template-picker-grid">
              {data.suggestedTemplates.map((template: TemplateItem) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-picker-card ${selectedTemplateId === template.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setIsTemplatePickerOpen(false);
                  }}
                >
                  <div
                    className="template-picker-cover"
                    style={{
                      background: `linear-gradient(135deg, ${template.colorA}, ${template.colorB})`,
                    }}
                  />
                  <div className="template-picker-meta">
                    <strong>{template.title}</strong>
                    <span>{template.slides} 页</span>
                  </div>
                </button>
              ))}
              {data.suggestedTemplates.length === 0 ? (
                <div className="report-template-empty">
                  <span>暂无 PPT 模板</span>
                  <button type="button" className="soft-button" onClick={() => onNavigate('templates')}>
                    去模板中心
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
