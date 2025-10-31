import { IJournalsApi } from '@/api/journals';
import { IWorkspaceApi } from '@/api/workspaces';

export type ConfigureAPIType = {
  api: ApiType;
  setNotAuthCallback: (callback: (status?: boolean) => void) => void;
};

export type ApiType = {
  app: any;
  adminSection: any;
  bpmn: any;
  bpmnAdmin: any;
  workspaces: IWorkspaceApi;
  menu: any;
  orgStruct: any;
  user: any;
  journals: IJournalsApi;
  tasks: any;
  comments: any;
  activities: any;
  dashboard: any;
  dmn: any;
  dmnEditor: any;
  pageTabs: any;
  docStatus: any;
  eventsHistory: any;
  versionsJournal: any;
  recordActions: any;
  docAssociations: any;
  view: any;
  birthdays: any;
  report: any;
  barcode: any;
  timesheetCommon: any;
  timesheetSubordinates: any;
  timesheetMine: any;
  timesheetVerification: any;
  timesheetDelegated: any;
  properties: any;
  documents: any;
  page: any;
  processAdmin: any;
  userConfig: any;
  docConstructor: any;
  customIcon: any;
  process: any;
  devTools: any;
  instanceAdmin: any;
  kanban: any;
  charts: any;
  previewList: any;
};

export type RecordsQueryResponse<R, A = any> = {
  hasMore: boolean;
  messages: string[];
  records: R[];
  totalCount: number;
  version?: number;
  attributes: A;
  errors: string[];
};

export type PureQueryResponse<T = unknown> = Promise<RecordsQueryResponse<T>>;
