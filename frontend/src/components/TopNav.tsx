import { Icon } from './Icon';
import type { TabKey } from '../types';

interface NavItem {
  key: TabKey;
  label: string;
  hint: string;
  count: string;
}

interface TopNavProps {
  activeTab: TabKey;
  tabs: NavItem[];
  onTabChange: (tab: TabKey) => void;
}

export function TopNav({ activeTab, tabs, onTabChange }: TopNavProps) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">
          <Icon name="spark" className="brand-icon" />
        </div>
        <div className="brand-copy compact">
          <strong>报告生成工作台</strong>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="主导航">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`nav-tab ${activeTab === tab.key ? 'is-active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <button type="button" className="accent-button nav-create" onClick={() => onTabChange('workbench')}>
          新建
        </button>
      </div>
    </header>
  );
}
