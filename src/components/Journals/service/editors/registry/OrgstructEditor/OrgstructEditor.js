import BaseEditor from '../BaseEditor';
import OrgstructEditorControl from './OrgstructEditorControl';

export default class OrgstructEditor extends BaseEditor {
  static TYPE = 'orgstruct';

  getEditorControl() {
    return OrgstructEditorControl;
  }

  getRecordValue(record) {
    return record.value;
  }
}
