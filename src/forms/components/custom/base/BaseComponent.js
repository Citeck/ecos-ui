import Records from '@citeck/records-core';

import FormIOBase from '../../override/base/Base';

import { t } from '@/helpers/util';

export default class BaseComponent extends FormIOBase {
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
    if (!this.isReadyToSubmit()) {
      if (this.root.submitting) {
        this.setCustomValidity(t('eform.form-is-not-ready'));
      }
      return false;
    }
    return true;
  }

  toString() {
    return this.constructor.name;
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
