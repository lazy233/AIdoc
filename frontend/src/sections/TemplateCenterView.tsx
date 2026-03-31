import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { SectionHeader } from '../components/SectionHeader';
import { TemplateCard } from '../components/TemplateCard';
import type { TabKey, TemplateCenterData } from '../types';

interface TemplateCenterViewProps {
  data: TemplateCenterData;
  onNavigate: (tab: TabKey) => void;
  onOpenReportTemplates: () => void;
}

export function TemplateCenterView({ data, onNavigate, onOpenReportTemplates }: TemplateCenterViewProps) {
  const [selectedCategory, setSelectedCategory] = useState(data.categories[0] ?? '全部');

  const visibleTemplates = useMemo(() => {
    if (selectedCategory === '全部') {
      return data.templates;
    }

    return data.templates.filter((template) => template.category === selectedCategory);
  }, [data.templates, selectedCategory]);

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
              <span>{data.templates.length}</span>
            </div>
            <button type="button" className="soft-button" onClick={() => onNavigate('workbench')}>
              前往工作台
            </button>
          </article>

          <article className="template-channel-card">
            <div className="template-channel-card-head">
              <strong>报告模板</strong>
              <span>{data.reportTemplates.length}</span>
            </div>
            <button type="button" className="accent-button" onClick={onOpenReportTemplates}>
              管理报告模板
              <Icon name="arrowRight" className="button-icon" />
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
            <button type="button" className="soft-button">
              <Icon name="upload" className="button-icon" />
              上传模板
            </button>
          }
        />

        <div className="category-strip">
          {data.categories.map((category) => (
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
          <>
            <article className="featured-layout">
              <div
                className="featured-preview"
                style={{
                  background: `linear-gradient(135deg, ${data.featured.colorA}, ${data.featured.colorB})`,
                }}
              >
                <h1 className="hero-title">
                  <span>{data.featured.title}</span>
                </h1>
                <div className="quick-chip-list align-left">
                  {data.featured.tags.map((tag) => (
                    <span key={tag} className="ghost-pill static-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="featured-copy">
                <SectionHeader
                  title={data.featured.title}
                  action={
                    <button type="button" className="accent-button" onClick={() => onNavigate('workbench')}>
                      使用模板
                      <Icon name="arrowRight" className="button-icon" />
                    </button>
                  }
                />
                <div className="featured-metrics">
                  <div>
                    <span>页数</span>
                    <strong>{data.featured.slides}</strong>
                  </div>
                  <div>
                    <span>使用次数</span>
                    <strong>{data.featured.usageCount}</strong>
                  </div>
                  <div>
                    <span>分类</span>
                    <strong>{data.featured.category}</strong>
                  </div>
                </div>
              </div>
            </article>

            <div className="template-grid">
              {visibleTemplates.map((template) => (
                <TemplateCard key={template.id} item={template} buttonLabel="使用" />
              ))}
            </div>
          </>
        )}
      </article>
    </section>
  );
}
