import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import FormIOEmailComponent from 'formiojs/components/email/Email';
import { overrideTriggerChange } from '../misc';

export default class EmailComponent extends FormIOEmailComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  isElementOrParentsHidden() {
    let current = this;

    while (!!current) {
      if (get(current, 'element.hidden') === true) {
        return true;
      }
      current = get(current, 'parent', null);
    }

    return false;
  }

  refresh(value, refreshOnKey) {
    if (this.hasOwnProperty('refreshOnValue')) {
      this.refreshOnChanged = !isEqual(value, this.refreshOnValue[refreshOnKey]);
      this.refreshOnValue[refreshOnKey] = value;
    } else {
      this.refreshOnChanged = true;
      this.refreshOnValue = {
        [refreshOnKey]: value
      };
    }

    if (this.refreshOnChanged && !this.isElementOrParentsHidden()) {
      if (this.component.clearOnRefresh) {
        this.setValue(null);
      }

      this.triggerRedraw();
    }
  }
}
