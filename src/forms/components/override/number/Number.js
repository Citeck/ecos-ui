import FormIONumberComponent from 'formiojs/components/number/Number';
import _ from 'lodash';
import { maskInput } from 'vanilla-text-mask';
import BigNumber from 'bignumber.js';
import { createNumberMask } from 'text-mask-addons';

import { overrideFieldLogic, overrideTriggerChange } from '../misc';
import { reverseString } from '../../../../helpers/util';

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

    overrideFieldLogic.call(this);
    overrideTriggerChange.call(this);
  }

  build(state) {
    super.build(state);

    if (this.element) {
      this.element.addEventListener('input', this.onInput);
      this.on('blur', this.onBlur);
    }

    // Cause: https://citeck.atlassian.net/browse/ECOSUI-528
    if (this.delimiter) {
      this.numberMask = createNumberMask({
        prefix: '',
        suffix: '',
        requireDecimal: _.get(this.component, 'requireDecimal', false),
        thousandsSeparatorSymbol: _.get(this.component, 'thousandsSeparator', this.component.delimiterValue || this.delimiter),
        decimalSymbol: _.get(this.component, 'decimalSymbol', this.decimalSeparator),
        decimalLimit: _.get(this.component, 'decimalLimit', this.decimalLimit),
        allowNegative: _.get(this.component, 'allowNegative', true),
        allowDecimal: _.get(this.component, 'allowDecimal', !(this.component.validate && this.component.validate.integer))
      });
    }
  }

  onBlur = () => {
    if (this.isBigNumber()) {
      const value = _.get(this, 'inputs.[0].value');
      const stringValue = this._getPureStringValue(value);

      _.set(this.component, 'stringValue', stringValue);

      this.setValue(stringValue);
    }
  };

  onInput = event => {
    const value = _.get(event, 'target.value');

    if (this.isBigNumber()) {
      _.set(this.component, 'stringValue', this._getPureStringValue(value));

      return;
    }

    if (!this.hasDegree(value)) {
      return;
    }

    const formattedValue = this.getFormattedByBigNumber(value);

    if (value !== formattedValue) {
      this.setValue(formattedValue);
    }
  };

  getFormattedByBigNumber(val) {
    let value = val;

    if (typeof val === 'string' && !this.hasDegree(val)) {
      value = val.replace(/\D/gi, '');
    }

    const floatingPointString = parseFloat(value).toFixed();
    const formattedByBigNumber = new BigNumber(floatingPointString).toFixed();

    if (floatingPointString !== formattedByBigNumber) {
      return formattedByBigNumber;
    }

    return val;
  }

  isBigNumber() {
    return _.get(this, 'component.isBigNumber', false);
  }

  hasDegree(val) {
    return new BigNumber(val).toString().includes('e+');
  }

  getMaskedValue(value) {
    return this.formatValue(this.clearInput(value));
  }

  /**
   * @override Number
   */
  clearInput(input) {
    let value = parseFloat(input);

    if (!_.isNaN(value)) {
      let strNumber = String(value);

      if (this.isBigNumber()) {
        strNumber = String(input);
        _.set(this.component, 'stringValue', strNumber);
      } else if (this.hasDegree(strNumber)) {
        strNumber = this.getFormattedByBigNumber(strNumber);
        _.set(this.component, 'stringValue', strNumber);
      }

      value = String(strNumber).replace('.', this.decimalSeparator);
    } else {
      value = null;
    }

    return value;
  }

  /**
   * @override Number
   */
  setValue(value, flags) {
    if (!Array.isArray(value)) {
      let stringValue = value;

      if (this.isBigNumber()) {
        stringValue = typeof value === 'string' ? value : new BigNumber(value).toFixed();
      } else if (this.hasDegree(value)) {
        stringValue = this.getFormattedByBigNumber(value);
      }

      _.set(this.component, 'stringValue', stringValue);

      return super.setValue(stringValue, flags);
    }

    return super.setValue(value, flags);
  }

  /**
   * @override Number
   */
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

  /**
   * @override Number
   */
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
      return this._prepareStringNumber(value);
    }

    if (this.hasDegree(value)) {
      return parseFloat(this.component.stringValue);
    }

    return value;
  }

  /**
   * @override Base
   */
  setupValueElement(element) {
    const renderValue = val => {
      element.innerHTML = val;
    };

    let value = this.getValue();

    if (this.isEmpty(value)) {
      renderValue(this.defaultViewOnlyValue);
      return;
    }

    if (this.isBigNumber() || this.hasDegree(value)) {
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

  _getPureStringValue(value = '') {
    let regexp = new RegExp(this.delimiter, 'g');

    if (this.delimiter && this.component.delimiterValue) {
      regexp = new RegExp(this.component.delimiterValue, 'g');
    }

    return value.replace(regexp, '').split(this.decimalSeparator)[0] || '';
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-78
  _prepareStringNumber(value = '') {
    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);
    let newValue = String(value);

    if (this.isBigNumber()) {
      const pureStringValue = this._getPureStringValue(newValue);

      newValue = String(value);
      _.set(this.component, 'stringValue', pureStringValue);
    } else if (this.hasDegree(newValue)) {
      newValue = this.getFormattedByBigNumber(value);
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

  /**
   * @override Number
   */
  getValueAt(index) {
    if (!this.inputs.length || !this.inputs[index]) {
      return null;
    }

    const val = this.inputs[index].value;

    if (!val) {
      return ''; // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2501 (See const "changed" in Base.updateValue())
    }

    if (this.isBigNumber()) {
      return this.component.stringValue;
    }

    return this.parseNumber(val);
  }
  /**
   * @override Number
   * @see Cause: https://citeck.atlassian.net/browse/ECOSUI-528
   */
  parseNumber(value) {
    // Remove delimiters and convert decimal separator to dot.
    value = value
      .split(this.component.delimiterValue || this.delimiter)
      .join('')
      .replace(this.decimalSeparator, '.');

    if (this.component.validate && this.component.validate.integer) {
      return parseInt(value, 10);
    }

    return parseFloat(value);
  }

  /**
   * @override Number
   */
  setInputMask(input) {
    input.setAttribute('pattern', '\\d*');

    input.mask = maskInput({
      inputElement: input,
      mask: (value, options) => this.recalculateMask(value, options, input)
    });
  }

  /**
   * @override Number
   * @see Cause: https://citeck.atlassian.net/browse/ECOSUI-109
   */
  recalculateMask = (value, options, input) => {
    const inputType = _.get(window, 'event.inputType');
    let newValue = value;

    if (this.isBigNumber()) {
      newValue = String(value);
    } else if (this.hasDegree(value)) {
      newValue = this._prepareStringNumber(newValue);
    }

    if (!this.delimiter) {
      newValue = reverseString(reverseString(newValue).replace(/\.|,/, this.decimalSeparator));
    }

    if (this.delimiter !== '.' && this.component.delimiterValue !== '.') {
      newValue = reverseString(reverseString(newValue).replace(/\./, this.decimalSeparator));
    }

    if (this.delimiter !== ',' && this.component.delimiterValue !== ',') {
      newValue = reverseString(reverseString(newValue).replace(/,/, this.decimalSeparator));
    }

    const formattedValue = this.formatValue(newValue);
    const maskedValue = super.getMaskedValue(newValue);
    const prevValue = options.previousConformedValue || '';

    let position = options.currentCaretPosition;

    if (value && formattedValue[0] === this.decimalSeparator) {
      position = _.includes(inputType, 'Backward') ? 2 : 1;
    }

    if (_.includes(inputType, 'Forward') && this.delimiter) {
      const separator = this.component.delimiterValue || this.delimiter;

      if (maskedValue.slice(position, position + separator.length) === separator) {
        position += separator.length;
      }
    }

    if (value && prevValue === maskedValue && !_.includes(inputType, 'Forward')) {
      position -= 1;
    }

    const diffLen = maskedValue.length - prevValue.length;

    if (position && Math.abs(diffLen) > 1 && position >= Math.abs(diffLen)) {
      position = position + diffLen / Math.abs(diffLen);
    }

    this.setCaretPosition(input, position);

    return this.numberMask(formattedValue, options);
  };

  setCaretPosition = _.debounce((input, position) => {
    input.selectionStart = position;
    input.selectionEnd = position;
  }, 0);
}
