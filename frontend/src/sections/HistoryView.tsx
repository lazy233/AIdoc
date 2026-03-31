import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { MetricCard } from '../components/MetricCard';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import type { HistoryData, TabKey } from '../types';

interface HistoryViewProps {
  data: HistoryData;
  onNavigate: (tab: TabKey) => void;
}

type FilterKey = 'all' | 'completed' | 'pending';

export function HistoryView({ data, onNavigate }: HistoryViewProps) {
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'completed', label: '已完成' },
    { key: 'pending', label: '处理中' },
  ];

  const visibleRecords = useMemo(() => {
    if (statusFilter === 'all') {
      return data.records;
    }

    if (statusFilter === 'completed') {
      return data.records.filter((record) => record.status.toLowerCase() === 'completed');
    }

    return data.records.filter((record) => record.status.toLowerCase() !== 'completed');
  }, [data.records, statusFilter]);

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
                    <strong>{record.title}</strong>
                    <p>
                      {record.template} · {record.format || '未设置格式'}
                    </p>
                  </div>
                  <StatusPill status={record.status} />
                </div>

                <div className="history-meta">
                  <span>
                    <Icon name="clock" className="button-icon" />
                    {record.createdAt}
                  </span>
                  <span>
                    <Icon name="team" className="button-icon" />
                    {record.students}
                  </span>
                  <span>
                    <Icon name="folder" className="button-icon" />
                    {record.owner}
                  </span>
                </div>

                <div className="history-footer">
                  <span>{record.lastAction}</span>
                  <div className="history-actions">
                    <button type="button" className="soft-button">
                      <Icon name="download" className="button-icon" />
                      下载
                    </button>
                    <button type="button" className="soft-button">
                      <Icon name="document" className="button-icon" />
                      详情
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
