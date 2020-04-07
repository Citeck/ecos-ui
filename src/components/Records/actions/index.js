import Registry from './RecordActionExecutorsRegistry';
import {
  BackgroundOpenAction,
  CreateNodeAction,
  DefaultActionTypes,
  DeleteAction,
  DownloadAction,
  DownloadCardTemplate,
  EditAction,
  MoveToLinesJournal,
  OpenURL,
  UploadNewVersion,
  ViewAction,
  Association
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
  [DefaultActionTypes.CREATE]: CreateNodeAction,
  [DefaultActionTypes.OPEN_URL]: OpenURL,
  [DefaultActionTypes.UPLOAD_NEW_VERSION]: UploadNewVersion,
  [DefaultActionTypes.ASSOCIATION]: Association,

  //legacy case actions

  REQUEST: CaseRequestAction,
  CREATE_NODE: CaseCreateNodeAction,
  REDIRECT: CaseRedirectAction
});
