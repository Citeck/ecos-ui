import FormIOHiddenComponent from 'formiojs/components/hidden/Hidden';

import { overrideTriggerChange } from '../misc';
import { DocUrls } from '../../../../constants/documentation';

export default class HiddenComponent extends FormIOHiddenComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  static get builderInfo() {
    return {
      ...super.builderInfo,
      documentation: `${DocUrls.COMPONENT}hidden`
    };
  }

  get visible() {
    return false;
  }

  set visible(value) {
    this._visible = false;
  }
}
