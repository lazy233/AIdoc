interface StatusPillProps {
  status: string;
}

function resolveTone(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes('completed') ||
    normalized.includes('published') ||
    normalized.includes('success') ||
    normalized.includes('完成') ||
    normalized.includes('已发布') ||
    normalized.includes('成功')
  ) {
    return 'success';
  }

  if (
    normalized.includes('pending') ||
    normalized.includes('processing') ||
    normalized.includes('queue') ||
    normalized.includes('draft') ||
    normalized.includes('处理中') ||
    normalized.includes('排队') ||
    normalized.includes('草稿')
  ) {
    return 'processing';
  }

  if (
    normalized.includes('failed') ||
    normalized.includes('warning') ||
    normalized.includes('error') ||
    normalized.includes('失败')
  ) {
    return 'warning';
  }

  return 'muted';
}

export function StatusPill({ status }: StatusPillProps) {
  return <span className={`status-pill tone-${resolveTone(status)}`}>{status}</span>;
}
