import FormIONumberComponent from 'formiojs/components/number/Number';
import _ from 'lodash';
import { maskInput } from 'vanilla-text-mask';

import { overrideTriggerChange } from '../misc';

export default class NumberComponent extends FormIONumberComponent {
  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  getMaskedValue(value) {
    return this.formatValue(this.clearInput(value));
  }

  formatValue(value) {
    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);

    if (this.component.requireDecimal && value && !value.includes(this.decimalSeparator)) {
      return `${value}${this.decimalSeparator}${_.repeat('0', decimalLimit)}`;
    } else if (this.component.requireDecimal && value && value.includes(this.decimalSeparator)) {
      return `${value}${_.repeat('0', decimalLimit - value.split(this.decimalSeparator)[1].length)}`;
    } else if (this.component.requireDecimal && !value) {
      // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3118
      return '';
    }

    return value;
  }

  setupValueElement(element) {
    let value = this.getValue();

    if (this.isEmpty(value)) {
      value = this.defaultViewOnlyValue;
    } else {
      value = this.parseNumber(this.getView(value));
      if (!isNaN(value)) {
        value = value.toLocaleString();
      }
    }

    element.innerHTML = value;
  }

  getValueAt(index) {
    if (!this.inputs.length || !this.inputs[index]) {
      return null;
    }

    const val = this.inputs[index].value;

    if (!val) {
      return ''; // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2501 (See const "changed" in Base.updateValue())
    }

    return this.parseNumber(val);
  }

  setInputMask(input) {
    input.setAttribute('pattern', '\\d*');

    input.mask = maskInput({
      inputElement: input,
      mask: this.recalculateMask
    });
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-109
  recalculateMask = (value, options) => {
    const updatedValue = value.replace(/\.|,/g, this.decimalSeparator);

    return this.numberMask(updatedValue, options);
  };
}
