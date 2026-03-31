interface StatusPillProps {
  status: string;
}

function resolveTone(status: string) {
  if (status.includes('完成') || status.includes('就绪') || status.includes('同步')) {
    return 'success';
  }

  if (status.includes('中') || status.includes('排队') || status.includes('自动')) {
    return 'processing';
  }

  if (status.includes('待') || status.includes('失败')) {
    return 'warning';
  }

  return 'muted';
}

export function StatusPill({ status }: StatusPillProps) {
  return <span className={`status-pill tone-${resolveTone(status)}`}>{status}</span>;
}
