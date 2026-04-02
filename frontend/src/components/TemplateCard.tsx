import { Icon } from './Icon';
import type { TemplateItem } from '../types';

interface TemplateCardProps {
  item: TemplateItem;
  buttonLabel?: string;
  onAction?: (item: TemplateItem) => void;
}

export function TemplateCard({ item, buttonLabel = '立即使用', onAction }: TemplateCardProps) {
  return (
    <article className="template-card">
      <div className="template-preview">
        <div className="template-preview-top">
          <span className="template-chip">{item.category}</span>
          {item.premium ? <span className="template-chip is-premium">Pro</span> : null}
        </div>
        {item.previewImageUrl ? (
          <div className="template-preview-image-shell">
            <img className="template-preview-image" src={item.previewImageUrl} alt={`${item.title} 首页预览`} loading="lazy" />
          </div>
        ) : (
          <div className="template-preview-canvas">
            <span className="template-preview-line is-wide" />
            <span className="template-preview-line" />
            <span className="template-preview-line is-short" />
            <div className="template-preview-blocks">
              <span />
              <span />
            </div>
          </div>
        )}
        <div className="template-preview-copy">
          <strong>{item.title}</strong>
          {item.description ? <p>{item.description}</p> : null}
        </div>
      </div>

      <div className="template-body">
        <div className="tag-list">
          {item.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="template-meta">
          <span>{item.slides} 页</span>
          <span>{item.usageCount} 次</span>
        </div>

        <button type="button" className="inline-button" onClick={() => onAction?.(item)}>
          {buttonLabel}
          <Icon name="arrowRight" className="button-icon" />
        </button>
      </div>
    </article>
  );
}
