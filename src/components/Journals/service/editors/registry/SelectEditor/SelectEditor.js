import BaseEditor from '../BaseEditor';
import SelectEditorControl from './SelectEditorControl';

export default class SelectEditor extends BaseEditor {
  static TYPE = 'select';

  getEditorControl() {
    return SelectEditorControl;
  }

  getRecordValue(record) {
    return record.value;
  }
}
