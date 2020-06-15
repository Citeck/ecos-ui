import { AppApi } from './app';
import { BarcodeApi } from './barcode';
import { BirthdaysApi } from './birthdays';
import { ReportApi } from './report';
import { BpmnApi } from './bpmn';
import { CommentsApi } from './comments';
import { DashboardApi } from './dashboard';
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

export function configureAPI() {
  const api = {};

  api.app = new AppApi();
  api.bpmn = new BpmnApi();
  api.menu = new MenuApi();
  api.orgStruct = new OrgStructApi();
  api.user = new UserApi();
  api.journals = new JournalsApi();
  api.tasks = new TasksApi();
  api.comments = new CommentsApi();
  api.dashboard = new DashboardApi();
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
  api.userConfig = new UserConfigApi();

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
