import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isString from 'lodash/isString';
import isDate from 'lodash/isDate';
import omitBy from 'lodash/omitBy';
import FormIODateTimeComponent from 'formiojs/components/datetime/DateTime';
import isEmpty from 'lodash/isEmpty';
import { parseISO, isValid } from 'date-fns';

export default class DateTimeComponent extends FormIODateTimeComponent {
  build(state) {
    super.build(state);

    this.widget.on('update', () => {
      this.setPristine(false);
      this.addClass(this.getElement(), 'formio-modified');
      this.updateValue();
    });
  }

  calculateValue(data, flags) {
    // If no calculated value or
    // hidden and set to clearOnHide (Don't calculate a value for a hidden field set to clear when hidden)
    if (!this.component.calculateValue || ((!this.visible || this.component.hidden) && this.component.clearOnHide)) {
      return false;
    } // Get the dataValue.

    let firstPass = false;
    let dataValue = null;
    const allowOverride = this.component.allowCalculateOverride;

    if (allowOverride) {
      dataValue = this.dataValue;
    } // First pass, the calculatedValue is undefined.

    if (this.calculatedValue === undefined) {
      firstPass = true;
      this.calculatedValue = null;
    } // Check to ensure that the calculated value is different than the previously calculated value.

    const calculatedValue = this.evaluate(
      this.component.calculateValue,
      {
        value: this.defaultValue,
        data: data
      },
      'value'
    ); // If this is the firstPass, and the dataValue is different than to the calculatedValue.

    if (allowOverride && this.calculatedValue !== null && isEqual(dataValue, calculatedValue)) {
      return false;
    } // Calculate the new value.

    if (allowOverride && firstPass && !this.isEmpty(dataValue) && isEqual(dataValue, calculatedValue)) {
      // Return that we have a change so it will perform another pass.
      this.calculatedValue = calculatedValue;
      return true;
    }

    flags = flags || {};
    flags.noCheck = true;
    const changed = this.setValue(calculatedValue, flags);
    this.calculatedValue = this.dataValue;
    return changed;
  }

  setValue(value, flags) {
    if (isString(value)) {
      const parsedDate = parseISO(value);

      if (isValid(parsedDate)) {
        value = parsedDate.toISOString().replace('.000Z', 'Z');
      } else {
        return;
      }
    } else if (isDate(value)) {
      value = value.toISOString().replace('.000Z', 'Z');
    }

    return super.setValue(value, flags);
  }

  getValue() {
    const value = super.getValue();

    if (isString(value)) {
      const parsedDate = parseISO(value);

      if (isValid(parsedDate)) {
        return parsedDate.toISOString().replace('.000Z', 'Z');
      } else {
        return '';
      }
    } else if (isDate(value)) {
      return value.toISOString().replace('.000Z', 'Z');
    }

    return value;
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

  static optimizeSchema(comp) {
    const defaultSchema = DateTimeComponent.schema();

    comp.datePicker = omitBy(comp.datePicker, (value, key) => isEqual(defaultSchema.datePicker[key], value));
    if (comp.timePicker) {
      comp.timePicker = omitBy(comp.timePicker, (value, key) => isEqual(defaultSchema.timePicker[key], value));
    }
    return omitBy(comp, (value, key) => {
      if (['datePicker', 'timePicker'].includes(key) && isEmpty(value)) {
        return true;
      }

      return key === 'widget';
    });
  }
}
