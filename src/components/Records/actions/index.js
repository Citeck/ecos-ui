import Registry from './RecordActionExecutorsRegistry';
import { EditAction, ViewAction, DownloadAction } from './DefaultActions';

Registry.addExecutors({
  edit: EditAction,
  view: ViewAction,
  download: DownloadAction
});
