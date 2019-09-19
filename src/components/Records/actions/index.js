import ActionsRegistry from './RecordActionExecutorsRegistry';
import { EditAction, ViewAction, DownloadAction } from './DefaultActions';

ActionsRegistry.register({
  edit: EditAction,
  view: ViewAction,
  download: DownloadAction
});
