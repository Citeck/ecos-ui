import FormIONumberComponent from 'formiojs/components/number/Number';
import _ from 'lodash';
import { maskInput } from 'vanilla-text-mask';

import { overrideTriggerChange } from '../misc';

export default class NumberComponent extends FormIONumberComponent {
  static schema(...extend) {
    return FormIONumberComponent.schema(
      {
        delimiter: false,
        requireDecimal: false,
        decimalLimit: '',
        stringValue: ''
      },
      ...extend
    );
  }

  get defaultSchema() {
    return NumberComponent.schema();
  }

  constructor(...args) {
    super(...args);

    overrideTriggerChange.call(this);
  }

  isBigInt(dataValue = this.dataValue) {
    let value = dataValue;

    if (typeof value === 'string') {
      value = parseFloat(value);
    }

    return String(value).includes('e+');
  }

  getMaskedValue(value) {
    return this.formatValue(this.clearInput(value));
  }

  clearInput(input) {
    let value = parseFloat(input);

    if (!_.isNaN(value)) {
      let strNumber = String(value);

      if (strNumber.includes('e+')) {
        strNumber = this.component.stringValue;
      }

      value = String(strNumber).replace('.', this.decimalSeparator);
    } else {
      value = null;
    }

    return value;
  }

  setValue(value, flags) {
    super.setValue(value, flags);

    if (this.isBigInt()) {
      this.dataValue = _.get(this.component, 'stringValue', value);
    }
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

  getValue() {
    let value = super.getValue();

    if (this.isBigInt(value)) {
      value = window.BigInt(value).toString();
      value = this._prepareStringNumber(value);
    }

    return value;
  }

  setupValueElement(element) {
    const renderValue = val => {
      element.innerHTML = val;
    };

    let value = this.getValue();

    if (this.isEmpty(value)) {
      renderValue(this.defaultViewOnlyValue);
      return;
    }

    if (this.isBigInt(value)) {
      value = window.BigInt(value).toString();
      value = this._prepareStringNumber(value);
      renderValue(value);
      return;
    }

    value = this.parseNumber(this.getView(value));
    if (isNaN(value)) {
      renderValue(this.defaultViewOnlyValue);
      return;
    }

    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);

    value = value.toString();
    value = value.replace(/,/g, '.');
    if (!!decimalLimit) {
      value = parseFloat(parseFloat(value).toFixed(decimalLimit)).toString();
    }
    value = value.replace(/\./g, this.decimalSeparator);
    if (!!decimalLimit) {
      value = this._fillZeros(value);
    }

    if (this.component.delimiter) {
      value = this._applyThousandsSeparator(value);
    }

    renderValue(value);
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-78
  _prepareStringNumber(value) {
    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);
    let newValue = value;

    newValue = newValue.replace(/,/g, '.');
    newValue = newValue.replace(/\./g, this.decimalSeparator);

    if (!!decimalLimit) {
      let [mainPart, decimalPart] = newValue.split(this.decimalSeparator);

      if (decimalPart) {
        decimalPart = decimalPart.slice(0, decimalLimit);
        newValue = `${mainPart}${this.decimalSeparator}${decimalPart}`;
      }

      newValue = this._fillZeros(newValue);
    }

    return newValue;
  }

  _fillZeros(value) {
    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);
    if (!decimalLimit) {
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

  _applyThousandsSeparator = value => {
    const [mainPart, decimalPart] = value.split(this.decimalSeparator);
    let newValue = parseInt(mainPart).toLocaleString();
    if (decimalPart) {
      newValue = `${newValue}${this.decimalSeparator}${decimalPart}`;
    }
    return newValue;
  };

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
    _.set(this.component, 'stringValue', value);

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
