import DateEditor from '../DateEditor';
import DateTimeEditorControl from './DateTimeEditorControl';

export default class DateTimeEditor extends DateEditor {
  static TYPE = 'datetime';

  getEditorControl() {
    return DateTimeEditorControl;
  }
}
