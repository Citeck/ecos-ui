import FormIOHiddenComponent from 'formiojs/components/hidden/Hidden';

import { t } from '../../../../helpers/export/util';
import { overrideTriggerChange } from '../misc';

export default class HiddenComponent extends FormIOHiddenComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  static get builderInfo() {
    return {
      title: t('form-constructor.hidden'),
      group: 'data',
      icon: 'fa fa-user-secret',
      schema: HiddenComponent.schema()
    };
  }

  get visible() {
    return false;
  }

  set visible(value) {
    this._visible = false;
  }
}
