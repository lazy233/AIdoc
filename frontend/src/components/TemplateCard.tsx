import { Icon } from './Icon';
import type { TemplateItem } from '../types';

interface TemplateCardProps {
  item: TemplateItem;
  buttonLabel?: string;
}

export function TemplateCard({ item, buttonLabel = '立即使用' }: TemplateCardProps) {
  return (
    <article className="template-card">
      <div
        className="template-preview"
        style={{
          background: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})`,
        }}
      >
        <div className="template-preview-top">
          <span className="template-chip">{item.category}</span>
          {item.premium ? <span className="template-chip is-premium">Pro</span> : null}
        </div>
        <div>
          <strong>{item.title}</strong>
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

        <button type="button" className="inline-button">
          {buttonLabel}
          <Icon name="arrowRight" className="button-icon" />
        </button>
      </div>
    </article>
  );
}
