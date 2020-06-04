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

      value = this.getRoundValue(value);
    }

    element.innerHTML = value;
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-3327
  getRoundValue(value) {
    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);
    if (decimalLimit === undefined) {
      return value;
    }

    let newValue = this.getValue();

    if (!isNaN(newValue)) {
      newValue = newValue.toString();
    }

    newValue = newValue.replace(/,/g, '.');
    newValue = parseFloat(parseFloat(newValue).toFixed(decimalLimit)).toString();
    newValue = newValue.replace(/\./g, this.decimalSeparator);
    newValue = this.fillZeros(newValue);

    return newValue;
  }

  fillZeros(value) {
    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);
    if (decimalLimit === undefined) {
      return value;
    }

    const [, decimalPart] = value.split(this.decimalSeparator);
    if (!decimalPart) {
      return value;
    }

    if (decimalPart.length < decimalLimit) {
      return `${value}${_.repeat('0', decimalLimit - decimalPart.length)}`;
    }

    return value;
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
      mask: (value, options) => this.recalculateMask(value, options, input)
    });
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-109
  recalculateMask = (value, options, input) => {
    const updatedValue = value.replace(/\.|,/g, this.decimalSeparator);
    const formattedValue = this.formatValue(updatedValue);
    let position = options.currentCaretPosition;

    if (formattedValue[0] === this.decimalSeparator) {
      position = 2;
    }

    if (options.previousConformedValue === super.getMaskedValue(updatedValue)) {
      position -= 1;
    }

    this.setCaretPosition(input, position);

    return this.numberMask(updatedValue, options);
  };

  setCaretPosition = _.debounce((input, position) => {
    input.selectionStart = position;
    input.selectionEnd = position;
  }, 10);
}
