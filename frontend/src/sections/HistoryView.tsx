import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { MetricCard } from '../components/MetricCard';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import {
  deleteHistoryEntry,
  getHistoryEntry,
  listHistories,
  updateHistoryEntry,
  type GenerationHistoryDetailApi,
  type GenerationHistoryListItemApi,
} from '../services/api';
import type { HistoryData, TabKey } from '../types';

interface HistoryViewProps {
  data: HistoryData;
  onNavigate: (tab: TabKey) => void;
  onRefresh: () => void;
}

type FilterKey = 'all' | 'completed' | 'pending';

export function HistoryView({ data, onNavigate, onRefresh }: HistoryViewProps) {
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [histories, setHistories] = useState<GenerationHistoryListItemApi[]>([]);
  const [detail, setDetail] = useState<GenerationHistoryDetailApi | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHistories = async () => {
    setHistories(await listHistories());
  };

  useEffect(() => {
    void loadHistories();
  }, []);

  const visibleRecords = useMemo(() => {
    if (statusFilter === 'all') {
      return histories;
    }

    if (statusFilter === 'completed') {
      return histories.filter((record) => (record.status ?? '').toLowerCase() === 'completed');
    }

    return histories.filter((record) => (record.status ?? '').toLowerCase() !== 'completed');
  }, [histories, statusFilter]);

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'completed', label: '已完成' },
    { key: 'pending', label: '处理中' },
  ];

  const handleOpenDetail = async (historyId: string) => {
    setDetail(await getHistoryEntry(historyId));
  };

  const handleSave = async () => {
    if (!detail) {
      return;
    }
    setIsSubmitting(true);
    try {
      await updateHistoryEntry(detail.id, {
        project_id: detail.project_id ?? null,
        student_id: detail.student_id ?? null,
        report_title: detail.report_title ?? null,
        ppt_template_id: detail.ppt_template_id ?? null,
        report_template_id: detail.report_template_id ?? null,
        output_format: detail.output_format ?? null,
        status: detail.status ?? null,
        output_file_path: detail.output_file_path ?? null,
      });
      await loadHistories();
      onRefresh();
      setDetail(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (historyId: string) => {
    await deleteHistoryEntry(historyId);
    if (detail?.id === historyId) {
      setDetail(null);
    }
    await loadHistories();
    onRefresh();
  };

  return (
    <section className="page-panel">
      <article className="card">
        <SectionHeader
          title="历史记录"
          action={
            <button type="button" className="soft-button" onClick={() => onNavigate('workbench')}>
              返回工作台
              <Icon name="arrowRight" className="button-icon" />
            </button>
          }
        />
        <div className="metric-grid">
          {data.stats.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </article>

      <article className="card">
        <SectionHeader title="任务列表" />
        <div className="category-strip">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`ghost-pill ${statusFilter === filter.key ? 'is-selected' : ''}`}
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="history-records">
          {visibleRecords.length === 0 ? (
            <div className="report-template-empty">暂无历史记录</div>
          ) : (
            visibleRecords.map((record) => (
              <article key={record.id} className="history-card">
                <div className="history-card-header">
                  <div>
                    <strong>{record.report_title || '未命名记录'}</strong>
                    <p>{record.output_format || '未设置格式'}</p>
                  </div>
                  <StatusPill status={record.status || 'draft'} />
                </div>

                <div className="history-meta">
                  <span>
                    <Icon name="clock" className="button-icon" />
                    {new Date(record.created_at).toLocaleString('zh-CN')}
                  </span>
                  <span>
                    <Icon name="document" className="button-icon" />
                    {record.id}
                  </span>
                </div>

                <div className="history-footer">
                  <span>{record.project_id ? `项目：${record.project_id}` : '未关联项目'}</span>
                  <div className="history-actions">
                    <button type="button" className="soft-button" onClick={() => void handleOpenDetail(record.id)}>
                      详情
                    </button>
                    <button type="button" className="soft-button" onClick={() => void handleDelete(record.id)}>
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </article>

      {detail ? (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <strong>历史记录详情</strong>
              <button type="button" className="modal-close" onClick={() => setDetail(null)}>
                ×
              </button>
            </div>

            <div className="report-template-form-grid">
              <label className="report-template-field">
                <span>报告标题</span>
                <input
                  value={detail.report_title ?? ''}
                  onChange={(event) => setDetail((current) => (current ? { ...current, report_title: event.target.value } : current))}
                />
              </label>

              <label className="report-template-field">
                <span>输出格式</span>
                <input
                  value={detail.output_format ?? ''}
                  onChange={(event) => setDetail((current) => (current ? { ...current, output_format: event.target.value } : current))}
                />
              </label>

              <label className="report-template-field">
                <span>状态</span>
                <input
                  value={detail.status ?? ''}
                  onChange={(event) => setDetail((current) => (current ? { ...current, status: event.target.value } : current))}
                />
              </label>

              <label className="report-template-field is-full">
                <span>输出路径</span>
                <input
                  value={detail.output_file_path ?? ''}
                  onChange={(event) =>
                    setDetail((current) => (current ? { ...current, output_file_path: event.target.value } : current))
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="soft-button" onClick={() => setDetail(null)}>
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
