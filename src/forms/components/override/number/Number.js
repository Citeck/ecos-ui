import FormIONumberComponent from 'formiojs/components/number/Number';
import _ from 'lodash';
import { maskInput } from 'vanilla-text-mask';
import BigNumber from 'bignumber.js';

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

  isBigNumber(val) {
    const isBigNumber = _.get(this, 'component.isBigNumber', false);

    if (val === undefined) {
      return isBigNumber;
    }

    return new BigNumber(val).toString().includes('e+') || isBigNumber;
  }

  getMaskedValue(value) {
    return this.formatValue(this.clearInput(value));
  }

  clearInput(input) {
    let value = parseFloat(input);

    if (!_.isNaN(value)) {
      let strNumber = String(value);

      if (this.isBigNumber(strNumber)) {
        strNumber = this.component.stringValue;
      }

      value = String(strNumber).replace('.', this.decimalSeparator);
    } else {
      value = null;
    }

    return value;
  }

  setValue(value, flags) {
    if (!Array.isArray(value) && this.isBigNumber(value)) {
      const stringValue = new BigNumber(value).toFixed(); /*String(value)*/

      _.set(this.component, 'stringValue', stringValue);
      this.dataValue = stringValue;

      for (const i in this.inputs) {
        if (this.inputs.hasOwnProperty(i)) {
          this.setValueAt(i, stringValue, flags);
        }
      }

      return this.updateValue(flags);
    }

    return super.setValue(value, flags);
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

    if (Array.isArray(value)) {
      value = value.map(item => {
        if (this.isBigNumber()) {
          item = this._prepareStringNumber(item);
        }

        return item;
      });

      return value;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);

      switch (true) {
        case keys.includes('str'):
          value = value.str;
          break;
        case keys.includes('num'):
          value = value.num;
          break;
        default:
          value = '';
      }
    }

    if (this.isBigNumber()) {
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

    if (this.isBigNumber(value)) {
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
  _prepareStringNumber(value = '') {
    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);
    let newValue = value;

    if (this.isBigNumber(value)) {
      newValue = this.formatValue(String(value));
      _.set(this.component, 'stringValue', newValue);
    }

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

    if (this.isBigNumber()) {
      return this._prepareStringNumber(val);
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
    if (this.isBigNumber(value)) {
      _.set(this.component, 'stringValue', value);
    }

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
