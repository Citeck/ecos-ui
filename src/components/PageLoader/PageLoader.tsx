import cn from 'classnames';
import React from 'react';

import { JOURNAL_VIEW_MODE } from '@/components/Journals/constants';
import { Pages, URL } from '@/constants';

import './PageLoader.scss';

type Props = {
  size?: number | string;
  duration?: number;
  className?: string;
};

const getViewFromPath = (path: string) => {
  const p = (path || '').toLowerCase();

  if (p.includes(URL.JOURNAL)) {
    return Pages.JOURNAL;
  }
  if (p.includes(URL.DEV_TOOLS) || (window?.location?.href || '').includes('type=DEV_TOOLS')) {
    return Pages.DEV_TOOLS;
  }
  if (p.includes(URL.DASHBOARD) || p === '/' || p === '') {
    return Pages.DASHBOARD;
  }

  return Pages.DASHBOARD;
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

const TableSkeleton = () => {
  const tableViewMode = new URLSearchParams(window?.location?.search || '').get('viewMode') || JOURNAL_VIEW_MODE.TABLE;

  switch (tableViewMode) {
    default:
      return (
        <div className="pl-table">
          <div className="pl-table__header">
            <div className="pl-table__header-actions">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="pl-brand shimmer" aria-hidden="true" style={{ width: 28, height: 28 }} />
              ))}
              <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 140, height: 28 }} />
              <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 143, height: 28 }} />
              <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 155, height: 28 }} />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="pl-brand shimmer" aria-hidden="true" style={{ width: 51, height: 28 }} />
              ))}
            </div>
            <div className="pl-table__header-handlers">
              <div className="pl-table__header-handlers--views">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="pl-brand shimmer" aria-hidden="true" style={{ width: 28, height: 28 }} />
                ))}
              </div>
              <div className="pl-table__header-handlers--pagination">
                <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 70, height: 16 }} />
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="pl-brand shimmer" aria-hidden="true" style={{ width: 28, height: 28 }} />
                ))}
              </div>
            </div>
          </div>
          <div className="pl-table-body">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="pl-table-row">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="pl-cell shimmer" key={i} />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
  }
};

const DevToolsSkeleton = () => (
  <div className="pl-table">
    <div className="pl-table-body one-col">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="pl-table-row">
          {Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="pl-cell shimmer" style={{ height: 30 }} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const PageLoader = ({ withoutHeader }: { withoutHeader?: boolean }) => {
  const view = getViewFromPath(window.location && window.location.pathname ? window.location.pathname : '/');

  return (
    <div className="skeleton-page-loader">
      {!withoutHeader && (
        <header className="skeleton-page-loader__header">
          <div className="skeleton-page-loader__header-actions">
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 32 }} />
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 90 }} />
          </div>
          <div className="skeleton-page-loader__header-actions">
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 310 }} />
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 52 }} />
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 80 }} />
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 158 }} />
          </div>
        </header>
      )}

      <div className="skeleton-page-loader__body">
        <aside className="skeleton-page-loader__body-sidebar">
          <div className="pl-logo shimmer" aria-hidden="true" />
          <nav className="pl-menu">
            <div className={cn('pl-menu-item shimmer', { active: view === Pages.DASHBOARD })} aria-label="Dashboard" />
            <div className={cn('pl-menu-item shimmer', { active: view === Pages.JOURNAL })} aria-label="Journal" />
            <div className={cn('pl-menu-item shimmer', { active: view === Pages.DEV_TOOLS })} aria-label="Admin" />
          </nav>
          {Array.from({ length: 4 }).map((_, i) => (
            <nav className="pl-menu" key={i}>
              <div className="pl-menu-item shimmer" aria-label="Dashboard" />
              <div className="pl-menu-item shimmer" aria-label="Journal" />
              <div className="pl-menu-item shimmer" aria-label="Admin" />
            </nav>
          ))}
        </aside>

        <main className="skeleton-page-loader__content">
          <div className="skeleton-page-loader__content-tabs">
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 162, height: 22 }} />
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 202, height: 22 }} />
            <div className="pl-brand shimmer" aria-hidden="true" style={{ width: 146, height: 22 }} />
          </div>
          <div className="skeleton-page-loader__content-inner">
            {view === Pages.DASHBOARD && <DashboardSkeleton />}
            {view === Pages.JOURNAL && <TableSkeleton />}
            {view === Pages.DEV_TOOLS && <DevToolsSkeleton />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageLoader;
