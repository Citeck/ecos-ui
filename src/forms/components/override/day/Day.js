import FormIODayComponent from 'formiojs/components/day/Day';

import { t } from '../../../../helpers/export/util';
import { overrideTriggerChange } from '../misc';

export default class DayComponent extends FormIODayComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  static get builderInfo() {
    return {
      title: t('form-constructor.day'),
      group: 'data',
      icon: 'fa fa-calendar',
      schema: DayComponent.schema()
    };
  }

  get visible() {
    return false;
  }

  set visible(value) {
    this._visible = false;
  }
}
