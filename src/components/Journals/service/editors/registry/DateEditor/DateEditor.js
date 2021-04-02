import BaseEditor from '../BaseEditor';
import DateEditorControl from './DateEditorControl';

export default class DateEditor extends BaseEditor {
  static TYPE = 'date';

  getEditorControl() {
    return DateEditorControl;
  }
}
