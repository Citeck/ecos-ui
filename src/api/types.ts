import { IWorkspaceApi } from '@/api/workspaces';

export type ConfigureAPIType = {
  api: ApiType;
  setNotAuthCallback: (callback: () => void) => void;
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
  journals: any;
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

export type RecordsQueryResponse<T> = {
  hasMore: boolean;
  messages: string[];
  records: T[];
  totalCount: number;
  version: number;
};

export type PureQueryResponse<T = unknown> = Promise<RecordsQueryResponse<T>>;
