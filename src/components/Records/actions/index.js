import Registry from './RecordActionExecutorsRegistry';
import { EditAction, ViewAction, DownloadAction, RemoveAction, MoveToLinesJournal } from './DefaultActions';

export { default } from './RecordActions';

Registry.addExecutors({
  edit: EditAction,
  view: ViewAction,
  download: DownloadAction,
  remove: RemoveAction,
  'move-to-lines': MoveToLinesJournal
});
