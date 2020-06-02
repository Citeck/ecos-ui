import Registry from './RecordActionExecutorsRegistry';
import {
  AssocAction,
  BackgroundOpenAction,
  CreateNodeAction,
  DefaultActionTypes,
  DeleteAction,
  DownloadAction,
  DownloadCardTemplate,
  EditAction,
  MoveToLinesJournal,
  OpenURL,
  PreviewModal,
  SaveAsCaseTemplate,
  UploadNewVersion,
  ViewAction,
  ViewCardTemplate
} from './DefaultActions';

import { CaseCreateNodeAction, CaseRedirectAction, CaseRequestAction } from './CaseActions';

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
  [DefaultActionTypes.PREVIEW]: PreviewModal,

  //legacy case actions

  REQUEST: CaseRequestAction,
  CREATE_NODE: CaseCreateNodeAction,
  REDIRECT: CaseRedirectAction
});
