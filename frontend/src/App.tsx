import { startTransition, useEffect, useState } from 'react';
import './App.css';
import { TopNav } from './components/TopNav';
import { getDataManagement, getHistory, getTemplateCenter, getWorkbench, listReportTemplates } from './services/api';
import { DataManagementView } from './sections/DataManagementView';
import { HistoryView } from './sections/HistoryView';
import { ReportTemplateManagerView } from './sections/ReportTemplateManagerView';
import { TemplateCenterView } from './sections/TemplateCenterView';
import { WorkbenchView } from './sections/WorkbenchView';
import type { AppData, ReportTemplate, TabKey } from './types';

type AppRoute = TabKey | 'reportTemplates';

function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>('workbench');
  const [appData, setAppData] = useState<AppData | null>(null);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [workbench, templateCenter, dataManagement, history, realReportTemplates] = await Promise.all([
        getWorkbench(),
        getTemplateCenter(),
        getDataManagement(),
        getHistory(),
        listReportTemplates(),
      ]);

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setAppData({
          workbench,
          templateCenter,
          dataManagement,
          history,
        });
        setReportTemplates(realReportTemplates);
        setLoadError(null);
        setIsLoading(false);
      });
    }

    load().catch((error: unknown) => {
      if (!cancelled) {
        setLoadError(error instanceof Error ? error.message : '加载失败');
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeTab: TabKey = activeRoute === 'reportTemplates' ? 'templates' : activeRoute;

  const navigation = [
    {
      key: 'workbench' as const,
      label: '生成工作台',
      hint: '',
      count: appData ? `${appData.workbench.queue.length}` : '',
    },
    {
      key: 'templates' as const,
      label: '模板中心',
      hint: '',
      count: appData ? `${appData.templateCenter.templates.length + reportTemplates.length}` : '',
    },
    {
      key: 'data' as const,
      label: '数据管理',
      hint: '',
      count: appData ? `${appData.dataManagement.students.length}` : '',
    },
    {
      key: 'history' as const,
      label: '历史记录',
      hint: '',
      count: appData ? `${appData.history.records.length}` : '',
    },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <section className="page-panel loading-panel">
          <div className="loading-hero card">
            <h1 className="hero-title">正在载入</h1>
            <div className="loading-bars">
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>
      );
    }

    if (!appData) {
      return (
        <section className="page-panel loading-panel">
          <div className="loading-hero card">
            <h1 className="hero-title">加载失败</h1>
            <p className="section-subtitle">{loadError ?? '后端接口不可用'}</p>
          </div>
        </section>
      );
    }

    if (activeRoute === 'reportTemplates') {
      return (
        <ReportTemplateManagerView
          templates={reportTemplates}
          onBack={() => setActiveRoute('templates')}
          onTemplatesChange={setReportTemplates}
        />
      );
    }

    if (activeRoute === 'workbench') {
      return <WorkbenchView data={appData.workbench} students={appData.dataManagement.students} onNavigate={setActiveRoute} />;
    }

    if (activeRoute === 'templates') {
      return (
        <TemplateCenterView
          data={{ ...appData.templateCenter, reportTemplates }}
          onNavigate={setActiveRoute}
          onOpenReportTemplates={() => setActiveRoute('reportTemplates')}
        />
      );
    }

    if (activeRoute === 'data') {
      return <DataManagementView data={appData.dataManagement} onNavigate={setActiveRoute} />;
    }

    return <HistoryView data={appData.history} onNavigate={setActiveRoute} />;
  };

  return (
    <div className="app-shell">
      <TopNav activeTab={activeTab} tabs={navigation} onTabChange={setActiveRoute} />
      <main>{renderContent()}</main>
    </div>
  );
}

export default App;
