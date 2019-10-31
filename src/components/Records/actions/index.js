import Registry from './RecordActionExecutorsRegistry';
import { EditAction, ViewAction, DownloadAction, DeleteAction, MoveToLinesJournal } from './DefaultActions';

import { CaseRequestAction, CaseCreateNodeAction } from './CaseActions';

export { default } from './RecordActions';

Registry.addExecutors({
  edit: EditAction,
  view: ViewAction,
  download: DownloadAction,
  delete: DeleteAction,
  'move-to-lines': MoveToLinesJournal,

  //legacy case actions

  REQUEST: CaseRequestAction,
  CREATE_NODE: CaseCreateNodeAction
});
