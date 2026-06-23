import BackgroundOpenAction from './handler/executor/BackgroundOpenAction';
import CreateAction from './handler/executor/CreateAction';
import DeleteAction from './handler/executor/DeleteAction';
import DownloadAction from './handler/executor/DownloadAction';
import EditAction from './handler/executor/EditAction';
import EditJournalPresetAction from './handler/executor/EditJournalPresetAction';
import EditPasswordAction from './handler/executor/EditPasswordAction';
import PreviewModalAction from './handler/executor/PreviewModalAction';
import ViewAction from './handler/executor/ViewAction';
import CancelBusinessProcessAction from './handler/executor/workflow/CancelBusinessProcessAction';
import SetTaskAssignee from './handler/executor/workflow/SetTaskAssignee';

import './actions';

export const ActionTypes = {
  DOWNLOAD: DownloadAction.ACTION_ID,
  CREATE: CreateAction.ACTION_ID,
  EDIT: EditAction.ACTION_ID,
  VIEW: ViewAction.ACTION_ID,
  BACKGROUND_VIEW: BackgroundOpenAction.ACTION_ID,
  CANCEL_WORKFLOW: CancelBusinessProcessAction.ACTION_ID,
  DELETE: DeleteAction.ACTION_ID,
  SET_TASK_ASSIGNEE: SetTaskAssignee.ACTION_ID,
  EDIT_PASSWORD: EditPasswordAction.ACTION_ID,
  EDIT_JOURNAL_PRESET: EditJournalPresetAction.ACTION_ID,
  PREVIEW: PreviewModalAction.ACTION_ID
};
