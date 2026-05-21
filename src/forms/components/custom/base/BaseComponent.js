import FormIOBase from '../../override/base/Base';

import Records from '@/components/Records/Records';
import { t } from '@/helpers/util';

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
    if (this.component.unreadable) {
      return true;
    }

    let isValid = super.checkValidity(data, dirty, rowData);
    if (!isValid) {
      return false;
    }
    // Only enforce isReadyToSubmit at submit time. Outside of submit (during
    // normal value-change checkValidity calls during init) treat the
    // component as valid even if async work is pending — otherwise form.errors
    // would include this asyncData and downstream checks like
    // `if (form.errors.length) return` would block submit prematurely.
    if (this.root.submitting && !this.isReadyToSubmit()) {
      this.setCustomValidity(t('eform.form-is-not-ready'));
      return false;
    }
    return true;
  }

  toString() {
    return this.constructor.name;
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
