import FormIOHiddenComponent from 'formiojs/components/hidden/Hidden';

import { overrideTriggerChange } from '../misc';

export default class HiddenComponent extends FormIOHiddenComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  get visible() {
    return false;
  }
}
