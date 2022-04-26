import FormIODayComponent from 'formiojs/components/address/Address';

import { t } from '../../../../helpers/export/util';
import { overrideTriggerChange } from '../misc';

export default class AddressComponent extends FormIODayComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  static get builderInfo() {
    return {
      title: t('form-constructor.address-field'),
      group: 'data',
      icon: 'fa fa-calendar',
      schema: AddressComponent.schema()
    };
  }

  get visible() {
    return false;
  }

  set visible(value) {
    this._visible = false;
  }
}
