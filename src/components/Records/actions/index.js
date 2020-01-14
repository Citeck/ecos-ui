import Registry from './RecordActionExecutorsRegistry';
import {
  EditAction,
  ViewAction,
  DownloadAction,
  DeleteAction,
  MoveToLinesJournal,
  BackgroundOpenAction,
  DownloadCardTemplate,
  CreateNodeAction
} from './DefaultActions';

import { CaseRequestAction, CaseCreateNodeAction, CaseRedirectAction } from './CaseActions';

export { default } from './RecordActions';

Registry.addExecutors({
  edit: EditAction,
  view: ViewAction,
  'open-in-background': BackgroundOpenAction,
  download: DownloadAction,
  delete: DeleteAction,
  'move-to-lines': MoveToLinesJournal,
  'download-card-template': DownloadCardTemplate,
  create: CreateNodeAction,

  //legacy case actions

  REQUEST: CaseRequestAction,
  CREATE_NODE: CaseCreateNodeAction,
  REDIRECT: CaseRedirectAction
});
