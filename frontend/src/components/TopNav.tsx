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
      <div className="topbar-shell">
        <div className="brand-block">
          <div className="brand-mark">
            <Icon name="spark" className="brand-icon" />
          </div>
          <div className="brand-copy">
            <strong>AI 文档生成</strong>
            <span>企业级报告与演示文稿工作台</span>
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
          <div className="top-user-card">
            <span>当前空间</span>
            <strong>演示环境</strong>
          </div>
          <button type="button" className="accent-button nav-create" onClick={() => onTabChange('workbench')}>
            新建工作台
          </button>
        </div>
      </div>
    </header>
  );
}
