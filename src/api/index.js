import { AppApi } from './app';
import { BarcodeApi } from './barcode';
import { BirthdaysApi } from './birthdays';
import { ReportApi } from './report';
import { BpmnApi } from './bpmn';
import { BpmnAdminApi } from './bpmnAdmin';
import { CommentsApi } from './comments';
import { DashboardApi } from './dashboard';
import { DmnApi } from './dmn';
import { DmnEditorApi } from './dmnEditor';
import { DocAssociationsApi } from './docAssociations';
import { DocStatusApi } from './docStatus';
import { DocumentsApi } from './documents';
import { EventsHistoryApi } from './eventsHistory';
import { JournalsApi } from './journalsApi';
import { MenuApi } from './menu';
import { MyTimesheetApi } from './timesheet/mine';
import { OrgStructApi } from './orgStruct';
import { PageApi } from './page';
import { PageTabsApi } from './pageTabs';
import { ProcessAdminApi } from './processAdmin';
import { PropertiesApi } from './properties';
import { RecordActionsApi } from './recordActions';
import { TasksApi } from './tasks';
import { TimesheetCommonApi } from './timesheet/common';
import { TimesheetDelegatedApi } from './timesheet/delegated';
import { TimesheetSubordinatesApi } from './timesheet/subordinates';
import { TimesheetVerificationApi } from './timesheet/verification';
import { UserApi } from './user';
import { UserConfigApi } from './userConfig';
import { VersionsJournalApi } from './versionsJournal';
import { ViewApi } from './view';
import { DocConstructorApi } from './docConstructor';
import { ChartsApi } from './charts';
import { CustomIconApi } from './customIcon';
import { AdminSectionApi } from './adminSection';
import { DevToolsApi } from './devTools';
import { InstanceAdminApi } from './instanceAdmin';
import ProcessApi from './process';
import { KanbanApi } from './kanban';

export function configureAPI() {
  const api = {};

  api.app = new AppApi();
  api.adminSection = new AdminSectionApi();
  api.bpmn = new BpmnApi();
  api.bpmnAdmin = new BpmnAdminApi();
  api.menu = new MenuApi();
  api.orgStruct = new OrgStructApi();
  api.user = new UserApi();
  api.journals = new JournalsApi();
  api.tasks = new TasksApi();
  api.comments = new CommentsApi();
  api.dashboard = new DashboardApi();
  api.dmn = new DmnApi();
  api.dmnEditor = new DmnEditorApi();
  api.pageTabs = new PageTabsApi();
  api.docStatus = new DocStatusApi();
  api.eventsHistory = new EventsHistoryApi();
  api.versionsJournal = new VersionsJournalApi();
  api.recordActions = new RecordActionsApi();
  api.docAssociations = new DocAssociationsApi();
  api.view = new ViewApi();
  api.birthdays = new BirthdaysApi();
  api.report = new ReportApi();
  api.barcode = new BarcodeApi();
  api.timesheetCommon = new TimesheetCommonApi();
  api.timesheetSubordinates = new TimesheetSubordinatesApi();
  api.timesheetMine = new MyTimesheetApi();
  api.timesheetVerification = new TimesheetVerificationApi();
  api.timesheetDelegated = new TimesheetDelegatedApi();
  api.properties = new PropertiesApi();
  api.documents = new DocumentsApi();
  api.page = new PageApi();
  api.processAdmin = new ProcessAdminApi();
  api.userConfig = new UserConfigApi();
  api.docConstructor = new DocConstructorApi();
  api.customIcon = new CustomIconApi();
  api.process = new ProcessApi();
  api.devTools = new DevToolsApi();
  api.instanceAdmin = new InstanceAdminApi();
  api.kanban = new KanbanApi();
  api.charts = new ChartsApi();

  const setNotAuthCallback = function(cb) {
    for (let key in api) {
      if (!api.hasOwnProperty(key)) {
        continue;
      }

      const apiItem = api[key];
      if (typeof apiItem.setNotAuthCallback !== 'function') {
        continue;
      }

      apiItem.setNotAuthCallback(cb);
    }
  };

  return { api, setNotAuthCallback };
}
