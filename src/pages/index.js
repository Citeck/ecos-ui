import React, { lazy, useState } from 'react';

import { Pages } from '../constants';
import Footer from './Footer';

const LoginPage = lazy(() => import('../components/LoginForm'));
const BPMNDesignerPage = lazy(() => import('./BPMNDesignerPage'));
const DashboardPage = lazy(() => import('./Dashboard'));
const DashboardSettingsPage = lazy(() => import('./DashboardSettings'));
const JournalsPage = lazy(() => import('./JournalsPage'));
const DevToolsPage = lazy(() => import('./DevTools'));
const MyTimesheetPage = lazy(() => import('./Timesheet/MyTimesheetPage'));
const SubordinatesTimesheetPage = lazy(() => import('./Timesheet/SubordinatesTimesheetPage'));
const VerificationTimesheetPage = lazy(() => import('./Timesheet/VerificationTimesheetPage'));
const DelegatedTimesheetsPage = lazy(() => import('./Timesheet/DelegatedTimesheetsPage'));

const FormIOPage = lazy(() => import('./debug/FormIOPage'));
const TreePage = lazy(() => import('./debug/Tree'));

export default ({ pageKey, withoutFooter, ...props }) => {
  const [footerRef, setFooterRef] = useState(null);
  let Page = null;

  switch (pageKey) {
    case Pages.LOGIN:
      return <LoginPage {...props} />;
    case Pages.BPMN:
      Page = BPMNDesignerPage;
      break;
    case Pages.DASHBOARD_SETTINGS:
      Page = DashboardSettingsPage;
      break;
    case Pages.DASHBOARD:
      Page = DashboardPage;
      break;
    case Pages.DEV_TOOLS:
      Page = DevToolsPage;
      break;
    case Pages.JOURNAL:
      Page = JournalsPage;
      break;
    case Pages.TIMESHEET_MY:
      Page = MyTimesheetPage;
      break;
    case Pages.TIMESHEET_SUBORDINATES:
      Page = SubordinatesTimesheetPage;
      break;
    case Pages.TIMESHEET_VERIFICATION:
      Page = VerificationTimesheetPage;
      break;
    case Pages.TIMESHEET_DELEGATED:
      Page = DelegatedTimesheetsPage;
      break;
    case Pages.DEBUG_FORMIO:
      Page = FormIOPage;
      break;
    case Pages.DEBUG_TREE:
      Page = TreePage;
      break;
    default:
  }

  return (
    <>
      <div className="app-content">
        <Page {...props} footerRef={footerRef} />
      </div>
      {!withoutFooter && <Footer forwardedRef={setFooterRef} />}
    </>
  );
};
