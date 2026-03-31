import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { SectionHeader } from '../components/SectionHeader';
import { createReportTemplate, deleteReportTemplate, updateReportTemplate } from '../services/api';
import type { ReportTemplate, ReportTemplateSection } from '../types';

interface ReportTemplateManagerViewProps {
  templates: ReportTemplate[];
  onBack: () => void;
  onTemplatesChange: (templates: ReportTemplate[]) => void;
}

function createSection(index: number): ReportTemplateSection {
  return {
    id: `section-${Date.now()}-${index}`,
    title: `章节 ${String(index).padStart(2, '0')}`,
    summary: '',
    contentPoints: [],
    dataBindings: [],
    recommendedPages: '',
  };
}

function createTemplateDraft(): ReportTemplate {
  return {
    id: '',
    name: '新报告模板',
    description: '',
    reportType: '结业报告',
    scene: '',
    updatedAt: '',
    status: 'draft',
    sections: [createSection(1)],
  };
}

function arrayToLines(value: string[]) {
  return value.join('\n');
}

function linesToArray(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ReportTemplateManagerView({
  templates,
  onBack,
  onTemplatesChange,
}: ReportTemplateManagerViewProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId('');
      return;
    }

    if (!templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;

  useEffect(() => {
    if (!selectedTemplate?.sections.length) {
      setSelectedSectionId('');
      return;
    }

    if (!selectedTemplate.sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(selectedTemplate.sections[0].id);
    }
  }, [selectedSectionId, selectedTemplate]);

  const selectedSection =
    selectedTemplate?.sections.find((section) => section.id === selectedSectionId) ??
    selectedTemplate?.sections[0] ??
    null;

  const persistTemplate = async (nextTemplate: ReportTemplate) => {
    const saved = await updateReportTemplate(nextTemplate);
    onTemplatesChange(templates.map((template) => (template.id === saved.id ? saved : template)));
  };

  const updateTemplate = (templateId: string, updater: (template: ReportTemplate) => ReportTemplate) => {
    const currentTemplate = templates.find((template) => template.id === templateId);

    if (!currentTemplate) {
      return;
    }

    const nextTemplate = updater(currentTemplate);
    onTemplatesChange(templates.map((template) => (template.id === templateId ? nextTemplate : template)));
    void persistTemplate(nextTemplate);
  };

  const handleCreateTemplate = async () => {
    const created = await createReportTemplate(createTemplateDraft());
    onTemplatesChange([created, ...templates]);
    setSelectedTemplateId(created.id);
    setSelectedSectionId(created.sections[0]?.id ?? '');
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) {
      return;
    }

    await deleteReportTemplate(selectedTemplate.id);
    const nextTemplates = templates.filter((template) => template.id !== selectedTemplate.id);
    onTemplatesChange(nextTemplates);
    setSelectedTemplateId(nextTemplates[0]?.id ?? '');
    setSelectedSectionId(nextTemplates[0]?.sections[0]?.id ?? '');
  };

  const handleAddSection = () => {
    if (!selectedTemplate) {
      return;
    }

    const nextSection = createSection(selectedTemplate.sections.length + 1);
    updateTemplate(selectedTemplate.id, (template) => ({
      ...template,
      sections: [...template.sections, nextSection],
    }));
    setSelectedSectionId(nextSection.id);
  };

  const handleUpdateSection = (
    templateId: string,
    sectionId: string,
    updater: (section: ReportTemplateSection) => ReportTemplateSection,
  ) => {
    updateTemplate(templateId, (template) => ({
      ...template,
      sections: template.sections.map((section) => (section.id === sectionId ? updater(section) : section)),
    }));
  };

  const handleDeleteSection = (templateId: string, sectionId: string) => {
    updateTemplate(templateId, (template) => ({
      ...template,
      sections: template.sections.filter((section) => section.id !== sectionId),
    }));
  };

  return (
    <section className="page-panel">
      <article className="card report-template-page-header">
        <div className="report-template-page-headline">
          <button type="button" className="back-button" onClick={onBack}>
            <Icon name="arrowRight" className="button-icon reverse-icon" />
          </button>
          <div>
            <h1 className="section-title report-template-page-title">模板编辑</h1>
          </div>
        </div>

        <div className="report-template-page-actions">
          <button type="button" className="accent-button" onClick={() => void handleCreateTemplate()}>
            新建报告模板
            <Icon name="arrowRight" className="button-icon" />
          </button>
        </div>
      </article>

      <div className="report-template-shell">
        <aside className="card report-template-sidebar">
          <SectionHeader title="报告模板" />

          <div className="report-template-list">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={`report-template-item ${selectedTemplateId === template.id ? 'is-active' : ''}`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <div className="report-template-item-head">
                  <strong>{template.name}</strong>
                  <span className="report-template-status">{template.status}</span>
                </div>
                <div className="report-template-item-meta">
                  <span>{template.sections.length} 个章节</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <article className="card report-template-editor">
          {selectedTemplate ? (
            <>
              <div className="report-template-editor-head">
                <SectionHeader title={selectedTemplate.name} />
                <button type="button" className="report-template-delete" onClick={() => void handleDeleteTemplate()}>
                  删除模板
                </button>
              </div>

              <div className="report-template-form-grid compact-two">
                <label className="report-template-field">
                  <span>模板名称</span>
                  <input
                    value={selectedTemplate.name}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, (template) => ({
                        ...template,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="report-template-field">
                  <span>状态</span>
                  <select
                    value={selectedTemplate.status}
                    onChange={(event) =>
                      updateTemplate(selectedTemplate.id, (template) => ({
                        ...template,
                        status: event.target.value as ReportTemplate['status'],
                      }))
                    }
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                </label>
              </div>

              <div className="report-template-section-bar">
                <div>
                  <strong>章节页面</strong>
                </div>
              </div>

              <div className="report-template-tabs">
                <div className="report-template-tab-strip">
                  {selectedTemplate.sections.map((section, index) => (
                    <div key={section.id} className={`report-template-tab ${selectedSectionId === section.id ? 'is-active' : ''}`}>
                      <button type="button" className="report-template-tab-main" onClick={() => setSelectedSectionId(section.id)}>
                        <span className="report-template-tab-index">{String(index + 1).padStart(2, '0')}</span>
                        <span className="report-template-tab-title">{section.title}</span>
                      </button>
                      <button
                        type="button"
                        className="report-template-tab-close"
                        onClick={() => handleDeleteSection(selectedTemplate.id, section.id)}
                        aria-label={`删除${section.title}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <button type="button" className="report-template-tab-add" onClick={handleAddSection} aria-label="新增章节">
                    +
                  </button>
                </div>

                {selectedSection ? (
                  <article className="report-template-tab-panel">
                    <div className="report-template-tab-panel-head">
                      <strong>{selectedSection.title}</strong>
                      <span>{selectedSection.recommendedPages || '-'}</span>
                    </div>

                    <div className="report-template-form-grid is-compact">
                      <label className="report-template-field">
                        <span>章节名称</span>
                        <input
                          value={selectedSection.title}
                          onChange={(event) =>
                            handleUpdateSection(selectedTemplate.id, selectedSection.id, (current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="report-template-field">
                        <span>页数</span>
                        <input
                          value={selectedSection.recommendedPages}
                          onChange={(event) =>
                            handleUpdateSection(selectedTemplate.id, selectedSection.id, (current) => ({
                              ...current,
                              recommendedPages: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="report-template-field is-full">
                        <span>章节说明</span>
                        <textarea
                          value={selectedSection.summary}
                          onChange={(event) =>
                            handleUpdateSection(selectedTemplate.id, selectedSection.id, (current) => ({
                              ...current,
                              summary: event.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </label>

                      <label className="report-template-field">
                        <span>内容要点</span>
                        <textarea
                          value={arrayToLines(selectedSection.contentPoints)}
                          onChange={(event) =>
                            handleUpdateSection(selectedTemplate.id, selectedSection.id, (current) => ({
                              ...current,
                              contentPoints: linesToArray(event.target.value),
                            }))
                          }
                          rows={6}
                        />
                      </label>

                      <label className="report-template-field">
                        <span>数据挂载字段</span>
                        <textarea
                          value={arrayToLines(selectedSection.dataBindings)}
                          onChange={(event) =>
                            handleUpdateSection(selectedTemplate.id, selectedSection.id, (current) => ({
                              ...current,
                              dataBindings: linesToArray(event.target.value),
                            }))
                          }
                          rows={6}
                        />
                      </label>
                    </div>
                  </article>
                ) : (
                  <div className="report-template-empty">暂无章节</div>
                )}
              </div>
            </>
          ) : (
            <div className="report-template-empty">暂无模板</div>
          )}
        </article>
      </div>
    </section>
  );
}
