import classNames from 'classnames';
import React, { lazy, useState } from 'react';

import { Pages } from '../constants';
import Footer from './Footer';

const AdminPage = lazy(() => import('./AdminPage'));
const DashboardPage = lazy(() => import('./Dashboard'));
const JournalsPage = lazy(() => import('./JournalsPage'));
const CMMNEditorPage = lazy(() => import('./ModelEditor/CMMNEditor'));
const BPMNEditorPage = lazy(() => import('./ModelEditor/BPMNEditor'));
const BPMNAdminProcessPage = lazy(() => import('./BpmnAdminProcessDashboard'));
const BPMNAdminIntancePage = lazy(() => import('./BpmnAdminInstanceDashboard'));
const BPMNMigration = lazy(() => import('./BPMNVersionsMigration'));
const DMNEditor = lazy(() => import('./ModelEditor/DMNEditor'));
const MyTimesheetPage = lazy(() => import('./Timesheet/MyTimesheetPage'));
const SubordinatesTimesheetPage = lazy(() => import('./Timesheet/SubordinatesTimesheetPage'));
const VerificationTimesheetPage = lazy(() => import('./Timesheet/VerificationTimesheetPage'));
const DelegatedTimesheetsPage = lazy(() => import('./Timesheet/DelegatedTimesheetsPage'));

const FormIOPage = lazy(() => import('./debug/FormIOPage'));
const TreePage = lazy(() => import('./debug/Tree'));
const CmmnPage = lazy(() => import('./debug/CmmnPage'));

const OrgstructurePage = lazy(() => import('./Orgstructure/Orgstructure'));

export default ({ pageKey, withoutFooter, ...props }) => {
  const [footerRef, setFooterRef] = useState(null);
  let Page = null;

  switch (pageKey) {
    case Pages.BPMN:
    case Pages.DEV_TOOLS:
      Page = AdminPage;
      break;
    case Pages.DASHBOARD:
      Page = DashboardPage;
      break;
    case Pages.JOURNAL:
      Page = JournalsPage;
      break;
    case Pages.BPMN_EDITOR:
      Page = BPMNEditorPage;
      break;
    case Pages.BPMN_ADMIN_PROCESS:
      Page = BPMNAdminProcessPage;
      break;
    case Pages.BPMN_ADMIN_INSTANCE:
      Page = BPMNAdminIntancePage;
      break;
    case Pages.BPMN_MIGRATION:
      Page = BPMNMigration;
      break;
    case Pages.DMN_EDITOR:
      Page = DMNEditor;
      break;
    case Pages.CMMN_EDITOR:
      Page = CMMNEditorPage;
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
    case Pages.DEBUG_CMMN:
      Page = CmmnPage;
      break;
    case Pages.ORGSTRUCTURE:
      Page = OrgstructurePage;
      break;
    default:
  }

  return (
    <>
      <div className={classNames('app-content', { 'orgstructure-page': pageKey === Pages.ORGSTRUCTURE })}>
        <Page {...props} footerRef={footerRef} />
      </div>
      {!withoutFooter && <Footer forwardedRef={setFooterRef} />}
    </>
  );
};
