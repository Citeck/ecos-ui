import FormIOBase from 'formiojs/components/base/Base';
import Records from '../../../../components/Records/Records';

export default class BaseComponent extends FormIOBase {
  getRecordId() {
    return this.root.options.recordId || '@';
  }

  getRecord() {
    return Records.get(this.getRecordId());
  }

  getAttributeToEdit() {
    return (this.component.properties || {}).attribute;
  }
}
