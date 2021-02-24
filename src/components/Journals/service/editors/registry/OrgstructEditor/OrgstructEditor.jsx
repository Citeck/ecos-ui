import BaseEditor from '../BaseEditor';
import OrgstructEditorView from './OrgstructEditorView';

export default class OrgstructEditor extends BaseEditor {
  static TYPE = 'orgstruct';

  get viewComponent() {
    return OrgstructEditorView;
  }

  getRecordValue(record) {
    return record.value;
  }
}
