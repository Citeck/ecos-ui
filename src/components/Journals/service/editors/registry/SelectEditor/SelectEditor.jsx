import BaseEditor from '../BaseEditor';
import SelectEditorView from './SelectEditorView';

export default class SelectEditor extends BaseEditor {
  static TYPE = 'select';

  get viewComponent() {
    return SelectEditorView;
  }

  getRecordValue(record) {
    return record.value;
  }
}
