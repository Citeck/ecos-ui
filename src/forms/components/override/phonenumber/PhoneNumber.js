import FormIOPhoneNumberComponent from 'formiojs/components/phonenumber/PhoneNumber';
import { overrideTriggerChange } from '../misc';

import { t } from '../../../../helpers/export/util';

export default class PhoneNumberComponent extends FormIOPhoneNumberComponent {
  static schema(...extend) {
    return FormIOPhoneNumberComponent.schema(
      {
        allowMultipleMasks: false,
        showWordCount: false,
        showCharCount: false,
        inputFormat: 'plain'
      },
      ...extend
    );
  }

  static get builderInfo() {
    return {
      title: t('form-constructor.phone-number'),
      group: 'advanced',
      icon: 'fa fa-phone-square',
      weight: 20,
      documentation: 'http://help.form.io/userguide/#phonenumber',
      schema: PhoneNumberComponent.schema()
    };
  }

  get defaultSchema() {
    return PhoneNumberComponent.schema();
  }

  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }
}
