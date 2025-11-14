import cn from 'classnames';
import isNumber from 'lodash/isNumber';
import React from 'react';

// no i18n text in skeleton loader
import './PageLoader.scss';

type Props = {
  size?: number | string;
  duration?: number;
  className?: string;
};

const getViewFromPath = (path: string) => {
  const p = (path || '').toLowerCase();

  if (p.includes('/journal')) return 'journal';
  if (p.includes('/admin')) return 'admin';
  if (p.includes('/dashboard') || p === '/' || p === '') return 'dashboard';

  return 'dashboard';
};

const DashboardSkeleton = () => (
  <div className="pl-dashboard">
    <div className="pl-widgets-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="pl-widget-box shimmer" />
      ))}
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="pl-table">
    <div className="pl-table-heading shimmer" />
    <div className="pl-table-body">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="pl-table-row">
          <div className="pl-cell shimmer" />
          <div className="pl-cell shimmer" />
          <div className="pl-cell shimmer" />
          <div className="pl-cell shimmer" />
        </div>
      ))}
    </div>
  </div>
);

const SmallSpinner: React.FC<{ style?: React.CSSProperties; className?: string }> = ({ style, className }) => (
  <div className={cn('citeck-page-loader', className)} style={style} role="status" aria-live="polite" aria-label="Загрузка">
    <div style={{ width: '36px', height: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="shimmer" style={{ width: 36, height: 10, borderRadius: 6 }} />
    </div>
  </div>
);

const PageLoader: React.FC<Props> = ({ size = 128, duration = 1.6, className }) => {
  const style: React.CSSProperties = {
    width: isNumber(size) ? `${size}px` : size,
    height: isNumber(size) ? `${size}px` : size,
    ...(duration ? ({ ['--duration' as any]: `${duration}s` } as React.CSSProperties) : {})
  };

  const view = getViewFromPath(window.location && window.location.pathname ? window.location.pathname : '/');

  return (
    <div className="pl-root">
      <header className="pl-header">
        <div className="pl-brand shimmer" aria-hidden="true" />
        <div className="pl-header-actions">
          <SmallSpinner style={style} className={className} />
        </div>
      </header>

      <div className="pl-body">
        <aside className="pl-sidebar">
          <div className="pl-logo shimmer" aria-hidden="true" />
          <nav className="pl-menu">
            <div className={`pl-menu-item ${view === 'dashboard' ? 'active' : ''} shimmer`} aria-label="Dashboard" />
            <div className={`pl-menu-item ${view === 'journal' ? 'active' : ''} shimmer`} aria-label="Journal" />
            <div className={`pl-menu-item ${view === 'admin' ? 'active' : ''} shimmer`} aria-label="Admin" />
          </nav>
        </aside>

        <main className="pl-content">
          <div className="pl-content-inner">
            {view === 'dashboard' && <DashboardSkeleton />}
            {view === 'journal' && <TableSkeleton />}
            {view === 'admin' && <TableSkeleton />}
          </div>
          <div className="pl-loading-caption" aria-hidden="true" />
        </main>
      </div>
    </div>
  );
};

export default PageLoader;
