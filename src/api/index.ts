import { ActivitiesApi } from './activities';
import { AdminSectionApi } from './adminSection';
import { AppApi } from './app';
import { BarcodeApi } from './barcode';
import { BirthdaysApi } from './birthdays';
import { BpmnApi } from './bpmn';
import { BpmnAdminApi } from './bpmnAdmin';
import { ChartsApi } from './charts';
import { CommentsApi } from './comments';
import { CustomIconApi } from './customIcon';
import { DashboardApi } from './dashboard';
import { DevToolsApi } from './devTools';
import { DmnApi } from './dmn';
import { DmnEditorApi } from './dmnEditor';
import { DocAssociationsApi } from './docAssociations';
import { DocConstructorApi } from './docConstructor';
import { DocStatusApi } from './docStatus';
import { DocumentsApi } from './documents';
import { EventsHistoryApi } from './eventsHistory';
import { InstanceAdminApi } from './instanceAdmin';
import { JournalsApi } from './journals';
import { KanbanApi } from './kanban';
import { MenuApi } from './menu';
import { OrgStructApi } from './orgStruct';
import { PageApi } from './page';
import { PageTabsApi } from './pageTabs';
import { PreviewListApi } from './previewList';
import { ProcessApi } from './process';
import { ProcessAdminApi } from './processAdmin';
import { PropertiesApi } from './properties';
import { RecordActionsApi } from './recordActions';
import { ReportApi } from './report';
import { TasksApi } from './tasks';
import { TimesheetCommonApi } from './timesheet/common';
import { TimesheetDelegatedApi } from './timesheet/delegated';
import { MyTimesheetApi } from './timesheet/mine';
import { TimesheetSubordinatesApi } from './timesheet/subordinates';
import { TimesheetVerificationApi } from './timesheet/verification';
import { UserApi } from './user';
import { UserConfigApi } from './userConfig';
import { VersionsJournalApi } from './versionsJournal';
import { ViewApi } from './view';
import { WorkspaceApi } from './workspaces';

import { ApiType, ConfigureAPIType } from '@/api/types';

export function configureAPI(): ConfigureAPIType {
  const api: ApiType = {
    app: new AppApi(),
    adminSection: new AdminSectionApi(),
    bpmn: new BpmnApi(),
    bpmnAdmin: new BpmnAdminApi(),
    workspaces: new WorkspaceApi(),
    menu: new MenuApi(),
    orgStruct: new OrgStructApi(),
    user: new UserApi(),
    journals: new JournalsApi(),
    tasks: new TasksApi(),
    comments: new CommentsApi(),
    activities: new ActivitiesApi(),
    dashboard: new DashboardApi(),
    dmn: new DmnApi(),
    dmnEditor: new DmnEditorApi(),
    pageTabs: new PageTabsApi(),
    docStatus: new DocStatusApi(),
    eventsHistory: new EventsHistoryApi(),
    versionsJournal: new VersionsJournalApi(),
    recordActions: new RecordActionsApi(),
    docAssociations: new DocAssociationsApi(),
    view: new ViewApi(),
    birthdays: new BirthdaysApi(),
    report: new ReportApi(),
    barcode: new BarcodeApi(),
    timesheetCommon: new TimesheetCommonApi(),
    timesheetSubordinates: new TimesheetSubordinatesApi(),
    timesheetMine: new MyTimesheetApi(),
    timesheetVerification: new TimesheetVerificationApi(),
    timesheetDelegated: new TimesheetDelegatedApi(),
    properties: new PropertiesApi(),
    documents: new DocumentsApi(),
    page: new PageApi(),
    processAdmin: new ProcessAdminApi(),
    userConfig: new UserConfigApi(),
    docConstructor: new DocConstructorApi(),
    customIcon: new CustomIconApi(),
    process: new ProcessApi(),
    devTools: new DevToolsApi(),
    instanceAdmin: new InstanceAdminApi(),
    kanban: new KanbanApi(),
    charts: new ChartsApi(),
    previewList: new PreviewListApi()
  };

  const setNotAuthCallback = function (cb: () => void) {
    for (const key in api) {
      if (!api.hasOwnProperty(key)) {
        continue;
      }

      const apiItem = api[key as keyof ApiType];
      if (typeof apiItem.setNotAuthCallback !== 'function') {
        continue;
      }

      apiItem.setNotAuthCallback(cb);
    }
  };

  return { api, setNotAuthCallback };
}
