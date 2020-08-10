import FormIOBase from 'formiojs/components/base/Base';
import Records from '../../../../components/Records/Records';
import { t } from '../../../../helpers/util';

export default class BaseComponent extends FormIOBase {
  getRecordId() {
    return this.root.options.recordId || '@';
  }

  getRecord() {
    return Records.get(this.getRecordId());
  }

  getAttributeToEdit() {
    return (this.component.properties || {}).attribute || this.key;
  }

  isReadyToSubmit() {
    return true;
  }

  checkValidity(data, dirty, rowData) {
    let isValid = super.checkValidity(data, dirty, rowData);
    if (!isValid) {
      return false;
    }
    if (!this.isReadyToSubmit()) {
      if (this.root.submitting) {
        this.setCustomValidity(t('eform.form-is-not-ready'));
      }
      return false;
    }
    return true;
  }

  /**
   * Create an evaluation context for all script executions and interpolations.
   *
   * @param additional
   * @return {*}
   */
  evalContext(additional) {
    return Object.assign(super.evalContext(additional), {
      recordId: this.getRecordId()
    });
  }

  buildHiddenElement() {
    this.element = this.ce(
      'dl',
      {
        id: this.id,
        class: 'd-none'
      },
      this.component.key
    );
  }
}
