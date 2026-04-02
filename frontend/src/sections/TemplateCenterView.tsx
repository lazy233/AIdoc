import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { SectionHeader } from '../components/SectionHeader';
import { TemplateCard } from '../components/TemplateCard';
import { deletePptTemplate, getPptTemplate, listPptTemplates, uploadPptTemplate, type PptTemplateDetailApi } from '../services/api';
import type { TabKey, TemplateCenterData } from '../types';

interface TemplateCenterViewProps {
  data: TemplateCenterData;
  onNavigate: (tab: TabKey) => void;
  onOpenReportTemplates: () => void;
  onRefresh: () => void;
}

export function TemplateCenterView({ data, onNavigate, onOpenReportTemplates, onRefresh }: TemplateCenterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [pptTemplates, setPptTemplates] = useState<PptTemplateDetailApi[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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
    setUploadedFile(null);
    setIsUploadOpen(true);
  };

  const handleSave = async () => {
    if (!uploadedFile) {
      return;
    }

    setIsSubmitting(true);
    try {
      await uploadPptTemplate(uploadedFile);
      setUploadedFile(null);
      setIsUploadOpen(false);
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
              上传 PPT 模板
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
              上传模板
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
                    description: template.source_file_name ?? template.theme_name ?? '',
                    category: template.category ?? '未分类',
                    tags: [template.aspect_ratio ?? '待解析', template.parse_status],
                    slides: template.page_count,
                    usageCount: 0,
                    colorA: '#153b5c',
                    colorB: '#4ad1c8',
                    previewImageUrl: template.cover_image_path ? `/storage/${template.cover_image_path}` : undefined,
                  }}
                  buttonLabel="使用"
                  onAction={() => onNavigate('workbench')}
                />
                <div className="history-actions" style={{ marginTop: 12 }}>
                  <button type="button" className="soft-button" onClick={() => void handleDelete(template.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {isUploadOpen ? (
        <div className="modal-backdrop" onClick={() => setIsUploadOpen(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <strong>上传 PPT 模板</strong>
              <button type="button" className="modal-close" onClick={() => setIsUploadOpen(false)}>
                ×
              </button>
            </div>

            <div className="report-template-form-grid">
              <label className="report-template-field is-full">
                <span>模板文件</span>
                <input type="file" accept=".ppt,.pptx" onChange={(event) => setUploadedFile(event.target.files?.[0] ?? null)} />
              </label>

              <div className="report-template-empty">
                只需上传 PPT 文件。模板名称、服务器文件地址、页数、宽高比等基础信息会由后端自动解析并写入数据库。
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="soft-button" onClick={() => setIsUploadOpen(false)}>
                取消
              </button>
              <button type="button" className="accent-button" onClick={() => void handleSave()} disabled={isSubmitting || !uploadedFile}>
                上传并解析
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
