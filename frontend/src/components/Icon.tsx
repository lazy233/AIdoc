import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  name:
    | 'spark'
    | 'upload'
    | 'outline'
    | 'arrowRight'
    | 'rocket'
    | 'template'
    | 'database'
    | 'history'
    | 'document'
    | 'chart'
    | 'team'
    | 'download'
    | 'refresh'
    | 'check'
    | 'alert'
    | 'clock'
    | 'folder';
}

export function Icon({ name, ...props }: IconProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'spark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M12 2.5 14.7 8l5.8 2.7-5.8 2.7L12 19l-2.7-5.6-5.8-2.7L9.3 8 12 2.5Z" {...common} />
        <path d="M19 3v2.5M20.25 4.25h-2.5M4 17v3M5.5 18.5h-3" {...common} />
      </svg>
    );
  }

  if (name === 'upload') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M12 15V4" {...common} />
        <path d="m7.5 8.5 4.5-4.5 4.5 4.5" {...common} />
        <path d="M5 18.5v1A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-1" {...common} />
      </svg>
    );
  }

  if (name === 'outline') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M5 6.5h14M5 12h14M5 17.5h14" {...common} />
        <circle cx="7" cy="6.5" r="1" fill="currentColor" />
        <circle cx="7" cy="12" r="1" fill="currentColor" />
        <circle cx="7" cy="17.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (name === 'arrowRight') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M5 12h14" {...common} />
        <path d="m13 6 6 6-6 6" {...common} />
      </svg>
    );
  }

  if (name === 'rocket') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M5.5 18.5c2.5-.3 4.5-2.3 5-4.8l5.7-5.7A5.5 5.5 0 0 0 10 2.8L4.3 8.5c-2.5.5-4.5 2.5-4.8 5l2 2Z" {...common} />
        <circle cx="14.2" cy="7.8" r="1.3" {...common} />
        <path d="m12 14 4 4M5 19l-2 2M8 21H3v-5" {...common} />
      </svg>
    );
  }

  if (name === 'template') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <rect x="3.5" y="4" width="17" height="16" rx="2.5" {...common} />
        <path d="M8 8h8M8 12h4M8 16h6" {...common} />
      </svg>
    );
  }

  if (name === 'database') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" {...common} />
        <path d="M4.5 5.5v6c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8v-6" {...common} />
        <path d="M4.5 11.5v6c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8v-6" {...common} />
      </svg>
    );
  }

  if (name === 'history') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M4.5 12A7.5 7.5 0 1 0 7 6.4" {...common} />
        <path d="M4.5 5.5v4h4" {...common} />
        <path d="M12 8.5V12l3 1.8" {...common} />
      </svg>
    );
  }

  if (name === 'document') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M8 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V5a1.5 1.5 0 0 1 1-1.5Z" {...common} />
        <path d="M14 3.8V8h4.2M9.5 12h5M9.5 15.5h5" {...common} />
      </svg>
    );
  }

  if (name === 'chart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M4 19.5h16" {...common} />
        <path d="M7 17V9.5M12 17V5.5M17 17v-7" {...common} />
      </svg>
    );
  }

  if (name === 'team') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <circle cx="9" cy="8" r="3" {...common} />
        <circle cx="17" cy="9.5" r="2.5" {...common} />
        <path d="M3.5 18a5.5 5.5 0 0 1 11 0M14 18a4 4 0 0 1 6.5-3" {...common} />
      </svg>
    );
  }

  if (name === 'download') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M12 4.5v10" {...common} />
        <path d="m7.5 10 4.5 4.5 4.5-4.5" {...common} />
        <path d="M5 18.5v1A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-1" {...common} />
      </svg>
    );
  }

  if (name === 'refresh') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M20 6.5v5h-5" {...common} />
        <path d="M19.5 11.5A7.5 7.5 0 0 1 5 15.5M4 17.5v-5h5" {...common} />
        <path d="M4.5 12.5A7.5 7.5 0 0 1 19 8.5" {...common} />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <circle cx="12" cy="12" r="8.5" {...common} />
        <path d="m8.5 12.2 2.5 2.5 4.8-5.3" {...common} />
      </svg>
    );
  }

  if (name === 'alert') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="m12 4 8 14H4l8-14Z" {...common} />
        <path d="M12 9v4.5M12 16.8h.01" {...common} />
      </svg>
    );
  }

  if (name === 'clock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <circle cx="12" cy="12" r="8.5" {...common} />
        <path d="M12 7.5V12l3 2" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M4.5 6.5h15v11h-15z" {...common} />
      <path d="M4.5 10.5h15" {...common} />
      <path d="M8.5 6.5v-2M15.5 6.5v-2" {...common} />
    </svg>
  );
}
