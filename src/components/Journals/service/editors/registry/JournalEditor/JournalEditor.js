import BaseEditor from '../BaseEditor';
import JournalEditorControl from './JournalEditorControl';

export default class JournalEditor extends BaseEditor {
  static TYPE = 'journal';

  getEditorControl() {
    return JournalEditorControl;
  }

  getRecordValue(record) {
    return record.value;
  }
}
