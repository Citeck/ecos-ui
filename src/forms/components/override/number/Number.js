import FormIONumberComponent from 'formiojs/components/number/Number';
import _ from 'lodash';

export default class NumberComponent extends FormIONumberComponent {
  getMaskedValue(value) {
    return this.formatValue(this.clearInput(value));
  }

  formatValue(value) {
    const decimalLimit = _.get(this.component, 'decimalLimit', this.decimalLimit);

    if (this.component.requireDecimal && value && !value.includes(this.decimalSeparator)) {
      return `${value}${this.decimalSeparator}${_.repeat('0', decimalLimit)}`;
    } else if (this.component.requireDecimal && value && value.includes(this.decimalSeparator)) {
      return `${value}${_.repeat('0', decimalLimit - value.split(this.decimalSeparator)[1].length)}`;
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
}
