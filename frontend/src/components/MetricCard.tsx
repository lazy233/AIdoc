import type { Metric } from '../types';

interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <article className={`metric-card accent-${metric.accent}`}>
      <span className="metric-label">{metric.label}</span>
      <strong className="metric-value">{metric.value}</strong>
      <p className="metric-detail">{metric.detail}</p>
    </article>
  );
}
