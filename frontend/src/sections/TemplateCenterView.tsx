import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { SectionHeader } from '../components/SectionHeader';
import { TemplateCard } from '../components/TemplateCard';
import {
  createPptTemplate,
  deletePptTemplate,
  getPptTemplate,
  listPptTemplates,
  updatePptTemplate,
  uploadFile,
  type PptTemplateDetailApi,
  type PptTemplatePayloadApi,
} from '../services/api';
import type { TabKey, TemplateCenterData } from '../types';

interface TemplateCenterViewProps {
  data: TemplateCenterData;
  onNavigate: (tab: TabKey) => void;
  onOpenReportTemplates: () => void;
  onRefresh: () => void;
}

type PptDialogMode = 'create' | 'edit';

interface PptTemplateDraft {
  id?: string;
  name: string;
  category: string;
  status: string;
  source_file_name: string;
  source_file_path: string;
  page_count: string;
  aspect_ratio: string;
  theme_name: string;
  parse_status: string;
  parse_error: string;
  template_version: string;
  uploadedFile?: File | null;
  sections: PptTemplateDetailApi['sections'];
  pages: PptTemplateDetailApi['pages'];
  outline_json: PptTemplateDetailApi['outline_json'];
  pages_json: PptTemplateDetailApi['pages_json'];
  components_json: PptTemplateDetailApi['components_json'];
  style_tokens_json: PptTemplateDetailApi['style_tokens_json'];
  slot_bindings_json: PptTemplateDetailApi['slot_bindings_json'];
  parsed_at?: string | null;
  file_size?: number | null;
  cover_image_path?: string | null;
}

function createEmptyDraft(): PptTemplateDraft {
  return {
    name: '',
    category: '教学培训',
    status: 'draft',
    source_file_name: '',
    source_file_path: '',
    page_count: '0',
    aspect_ratio: '16:9',
    theme_name: '',
    parse_status: 'pending',
    parse_error: '',
    template_version: 'v1',
    uploadedFile: null,
    sections: [],
    pages: [],
    outline_json: [],
    pages_json: [],
    components_json: [],
    style_tokens_json: {},
    slot_bindings_json: {},
    parsed_at: null,
    file_size: null,
    cover_image_path: null,
  };
}

function fromDetail(detail: PptTemplateDetailApi): PptTemplateDraft {
  return {
    id: detail.id,
    name: detail.name,
    category: detail.category ?? '',
    status: detail.status,
    source_file_name: detail.source_file_name ?? '',
    source_file_path: detail.source_file_path,
    page_count: String(detail.page_count ?? 0),
    aspect_ratio: detail.aspect_ratio ?? '',
    theme_name: detail.theme_name ?? '',
    parse_status: detail.parse_status,
    parse_error: detail.parse_error ?? '',
    template_version: detail.template_version ?? '',
    uploadedFile: null,
    sections: detail.sections,
    pages: detail.pages,
    outline_json: detail.outline_json,
    pages_json: detail.pages_json,
    components_json: detail.components_json,
    style_tokens_json: detail.style_tokens_json,
    slot_bindings_json: detail.slot_bindings_json,
    parsed_at: detail.parsed_at ?? null,
    file_size: detail.file_size ?? null,
    cover_image_path: detail.cover_image_path ?? null,
  };
}

function toPayload(draft: PptTemplateDraft): PptTemplatePayloadApi {
  return {
    name: draft.name,
    category: draft.category || null,
    status: draft.status,
    source_file_name: draft.source_file_name || null,
    source_file_path: draft.source_file_path,
    cover_image_path: draft.cover_image_path ?? null,
    file_size: draft.file_size ?? null,
    page_count: Number(draft.page_count || 0),
    aspect_ratio: draft.aspect_ratio || null,
    theme_name: draft.theme_name || null,
    template_version: draft.template_version || null,
    parse_status: draft.parse_status,
    parse_error: draft.parse_error || null,
    outline_json: draft.outline_json,
    pages_json: draft.pages_json,
    components_json: draft.components_json,
    style_tokens_json: draft.style_tokens_json,
    slot_bindings_json: draft.slot_bindings_json,
    parsed_at: draft.parsed_at ?? null,
    sections: draft.sections,
    pages: draft.pages,
  };
}

export function TemplateCenterView({ data, onNavigate, onOpenReportTemplates, onRefresh }: TemplateCenterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [pptTemplates, setPptTemplates] = useState<PptTemplateDetailApi[]>([]);
  const [dialogMode, setDialogMode] = useState<PptDialogMode>('create');
  const [draft, setDraft] = useState<PptTemplateDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTemplates = async () => {
    const list = await listPptTemplates();
    const details = await Promise.all(list.map((item) => getPptTemplate(item.id)));
    setPptTemplates(details);
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const categories = useMemo(() => {
    const items = new Set(['全部']);
    pptTemplates.forEach((item) => {
      if (item.category) {
        items.add(item.category);
      }
    });
    return [...items];
  }, [pptTemplates]);

  const visibleTemplates = useMemo(() => {
    if (selectedCategory === '全部') {
      return pptTemplates;
    }
    return pptTemplates.filter((template) => template.category === selectedCategory);
  }, [pptTemplates, selectedCategory]);

  const handleOpenCreate = () => {
    setDialogMode('create');
    setDraft(createEmptyDraft());
  };

  const handleOpenEdit = async (templateId: string) => {
    setDialogMode('edit');
    setDraft(fromDetail(await getPptTemplate(templateId)));
  };

  const handleSave = async () => {
    if (!draft || !draft.name.trim() || (!draft.source_file_path && !draft.uploadedFile)) {
      return;
    }

    setIsSubmitting(true);
    try {
      let nextDraft = draft;
      if (draft.uploadedFile) {
        const uploaded = await uploadFile(draft.uploadedFile, 'template', draft.name);
        nextDraft = {
          ...draft,
          source_file_name: uploaded.file_name,
          source_file_path: uploaded.file_path,
          file_size: uploaded.file_size,
          uploadedFile: null,
        };
      }

      if (dialogMode === 'create') {
        await createPptTemplate(toPayload(nextDraft));
      } else if (nextDraft.id) {
        await updatePptTemplate(nextDraft.id, toPayload(nextDraft));
      }

      setDraft(null);
      await loadTemplates();
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    await deletePptTemplate(templateId);
    await loadTemplates();
    onRefresh();
  };

  return (
    <section className="page-panel">
      <article className="card template-channel-board">
        <div className="template-channel-copy">
          <h1 className="hero-title plain-hero-title">模板中心</h1>
        </div>

        <div className="template-channel-grid">
          <article className="template-channel-card is-active">
            <div className="template-channel-card-head">
              <strong>PPT 模板</strong>
              <span>{pptTemplates.length}</span>
            </div>
            <button type="button" className="accent-button" onClick={handleOpenCreate}>
              新建 PPT 模板
            </button>
          </article>

          <article className="template-channel-card">
            <div className="template-channel-card-head">
              <strong>报告模板</strong>
              <span>{data.reportTemplates.length}</span>
            </div>
            <button type="button" className="soft-button" onClick={onOpenReportTemplates}>
              管理报告模板
            </button>
          </article>
        </div>
      </article>

      <article className="card">
        <SectionHeader
          title="报告模板"
          action={
            <button type="button" className="accent-button" onClick={onOpenReportTemplates}>
              打开管理页
              <Icon name="arrowRight" className="button-icon" />
            </button>
          }
        />

        {data.reportTemplates.length === 0 ? (
          <div className="report-template-empty">暂无报告模板</div>
        ) : (
          <div className="report-template-overview-grid">
            {data.reportTemplates.map((template) => (
              <article key={template.id} className="report-template-overview-card">
                <div className="report-template-overview-head">
                  <strong>{template.name}</strong>
                  <span className={`report-template-status ${template.status === 'published' ? 'is-enabled' : ''}`}>
                    {template.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
                <div className="tag-list">
                  <span className="tag">{template.reportType}</span>
                </div>
                <div className="report-template-overview-meta">
                  <span>{template.sections.length} 个章节</span>
                  <span>{template.updatedAt}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>

      <article className="card">
        <SectionHeader
          title="PPT 模板"
          action={
            <button type="button" className="soft-button" onClick={handleOpenCreate}>
              <Icon name="upload" className="button-icon" />
              新建模板
            </button>
          }
        />

        <div className="category-strip">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`ghost-pill ${selectedCategory === category ? 'is-selected' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {visibleTemplates.length === 0 ? (
          <div className="report-template-empty">暂无 PPT 模板</div>
        ) : (
          <div className="template-grid">
            {visibleTemplates.map((template) => (
              <div key={template.id}>
                <TemplateCard
                  item={{
                    id: template.id,
                    title: template.name,
                    description: template.theme_name ?? '',
                    category: template.category ?? '未分类',
                    tags: [template.aspect_ratio ?? '16:9', template.parse_status],
                    slides: template.page_count,
                    usageCount: 0,
                    colorA: '#153b5c',
                    colorB: '#4ad1c8',
                  }}
                  buttonLabel="使用"
                  onAction={() => onNavigate('workbench')}
                />
                <div className="history-actions" style={{ marginTop: 12 }}>
                  <button type="button" className="soft-button" onClick={() => void handleOpenEdit(template.id)}>
                    编辑
                  </button>
                  <button type="button" className="soft-button" onClick={() => void handleDelete(template.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {draft ? (
        <div className="modal-backdrop" onClick={() => setDraft(null)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <strong>{dialogMode === 'create' ? '新建 PPT 模板' : '编辑 PPT 模板'}</strong>
              <button type="button" className="modal-close" onClick={() => setDraft(null)}>
                ×
              </button>
            </div>

            <div className="report-template-form-grid">
              <label className="report-template-field">
                <span>模板名称</span>
                <input value={draft.name} onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))} />
              </label>

              <label className="report-template-field">
                <span>分类</span>
                <input value={draft.category} onChange={(event) => setDraft((current) => (current ? { ...current, category: event.target.value } : current))} />
              </label>

              <label className="report-template-field">
                <span>状态</span>
                <select value={draft.status} onChange={(event) => setDraft((current) => (current ? { ...current, status: event.target.value } : current))}>
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </label>

              <label className="report-template-field">
                <span>页数</span>
                <input value={draft.page_count} onChange={(event) => setDraft((current) => (current ? { ...current, page_count: event.target.value } : current))} />
              </label>

              <label className="report-template-field">
                <span>宽高比</span>
                <input value={draft.aspect_ratio} onChange={(event) => setDraft((current) => (current ? { ...current, aspect_ratio: event.target.value } : current))} />
              </label>

              <label className="report-template-field">
                <span>主题名</span>
                <input value={draft.theme_name} onChange={(event) => setDraft((current) => (current ? { ...current, theme_name: event.target.value } : current))} />
              </label>

              <label className="report-template-field is-full">
                <span>模板文件</span>
                <input
                  type="file"
                  accept=".ppt,.pptx"
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, uploadedFile: event.target.files?.[0] ?? null } : current,
                    )
                  }
                />
              </label>

              <label className="report-template-field is-full">
                <span>文件路径</span>
                <input value={draft.source_file_path} onChange={(event) => setDraft((current) => (current ? { ...current, source_file_path: event.target.value } : current))} />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="soft-button" onClick={() => setDraft(null)}>
                取消
              </button>
              <button type="button" className="accent-button" onClick={() => void handleSave()} disabled={isSubmitting}>
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
