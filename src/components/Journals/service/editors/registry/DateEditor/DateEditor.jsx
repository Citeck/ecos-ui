import BaseEditor from '../BaseEditor';
import DateEditorView from './DateEditorView';

export default class DateEditor extends BaseEditor {
  static TYPE = 'date';

  get viewComponent() {
    return DateEditorView;
  }
}
