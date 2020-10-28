import Registry from './RecordActionExecutorsRegistry';
import {
  AssocAction,
  BackgroundOpenAction,
  CancelBusinessProcess,
  CreateNodeAction,
  DefaultActionTypes,
  DeleteAction,
  DownloadAction,
  DownloadCardTemplate,
  EditAction,
  EditTaskAssignee,
  FetchAction,
  MoveToLinesJournal,
  MutateAction,
  OpenSubmitFormAction,
  OpenURL,
  PreviewModal,
  SaveAsCaseTemplate,
  ScriptAction,
  UploadNewVersion,
  ViewAction,
  ViewBusinessProcess,
  ViewCardTemplate
} from './DefaultActions';

import { CaseCreateNodeAction, CaseRedirectAction, CaseRequestAction } from './CaseActions';
import { ModuleActionTypes, ModuleCopyAction } from './ModuleActions';

export { default } from './RecordActions';
export { DefaultActionTypes } from './DefaultActions';

Registry.addExecutors({
  [DefaultActionTypes.EDIT]: EditAction,
  [DefaultActionTypes.VIEW]: ViewAction,
  [DefaultActionTypes.OPEN_IN_BACKGROUND]: BackgroundOpenAction,
  [DefaultActionTypes.DOWNLOAD]: DownloadAction,
  [DefaultActionTypes.DELETE]: DeleteAction,
  [DefaultActionTypes.MOVE_TO_LINES]: MoveToLinesJournal,
  [DefaultActionTypes.DOWNLOAD_CARD_TEMPLATE]: DownloadCardTemplate,
  [DefaultActionTypes.SAVE_AS_CASE_TEMPLATE]: SaveAsCaseTemplate,
  [DefaultActionTypes.CREATE]: CreateNodeAction,
  [DefaultActionTypes.OPEN_URL]: OpenURL,
  [DefaultActionTypes.UPLOAD_NEW_VERSION]: UploadNewVersion,
  [DefaultActionTypes.ASSOC_ACTION]: AssocAction,
  [DefaultActionTypes.VIEW_CARD_TEMPLATE]: ViewCardTemplate,
  [DefaultActionTypes.PREVIEW_MODAL]: PreviewModal,
  [DefaultActionTypes.FETCH]: FetchAction,
  [DefaultActionTypes.SCRIPT]: ScriptAction,
  [DefaultActionTypes.EDIT_TASK_ASSIGNEE]: EditTaskAssignee,
  [DefaultActionTypes.VIEW_BUSINESS_PROCESS]: ViewBusinessProcess,
  [DefaultActionTypes.CANCEL_BUSINESS_PROCESS]: CancelBusinessProcess,
  [DefaultActionTypes.MUTATE]: MutateAction,
  [DefaultActionTypes.OPEN_SUBMIT_FORM]: OpenSubmitFormAction,

  [ModuleActionTypes.MODULE_COPY]: ModuleCopyAction,

  //legacy case actions

  REQUEST: CaseRequestAction,
  CREATE_NODE: CaseCreateNodeAction,
  REDIRECT: CaseRedirectAction
});
