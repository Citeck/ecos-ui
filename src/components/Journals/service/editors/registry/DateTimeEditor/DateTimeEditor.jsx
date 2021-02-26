import DateEditor from '../DateEditor';
import DateTimeEditorView from './DateTimeEditorView';

export default class DateTimeEditor extends DateEditor {
  static TYPE = 'datetime';

  get viewComponent() {
    return DateTimeEditorView;
  }
}
