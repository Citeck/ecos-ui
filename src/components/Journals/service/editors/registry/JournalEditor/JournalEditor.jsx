import BaseEditor from '../BaseEditor';
import JournalEditorView from './JournalEditorView';

export default class JournalEditor extends BaseEditor {
  static TYPE = 'journal';

  get viewComponent() {
    return JournalEditorView;
  }

  getRecordValue(record) {
    return record.value;
  }
}
