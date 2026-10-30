import { parseISO, isValid, format } from 'date-fns';
import FormIODateTimeComponent from 'formiojs/components/datetime/DateTime';
import get from 'lodash/get';
import isDate from 'lodash/isDate';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isString from 'lodash/isString';
import omitBy from 'lodash/omitBy';
import set from 'lodash/set';

export default class DateTimeComponent extends FormIODateTimeComponent {
  constructor(...args) {
    super(...args);

    // A date without time is a calendar day, independent of the viewer timezone.
    if (this.isDateOnly) {
      this.component.widget.dateFormat = 'yyyy-MM-dd';
      this.component.widget.saveAs = 'text';
    }
  }

  get isDateOnly() {
    return this.component.enableTime === false && this.component.enableDate !== false;
  }

  get dataValue() {
    return super.dataValue;
  }

  set dataValue(value) {
    // Formio's base setter removes nulls; calendar JSON distinguishes null from ''.
    if (this.isDateOnly && value == null && this.key) {
      set(this.data, this.key, null);
    } else {
      super.dataValue = value;
    }
  }

  get validationValue() {
    // The calendar widget expects a string or array and cannot validate null.
    if (this.isDateOnly) {
      const value = this.dataValue;
      return Array.isArray(value) ? value.map(date => parseISO(date)) : value ? parseISO(value) : '';
    }
    return super.validationValue;
  }

  get emptyValue() {
    return this.isDateOnly ? (this.component.multiple ? [] : null) : super.emptyValue;
  }

  build(state) {
    super.build(state);

    this.widget.on('update', () => {
      this.setPristine(false);
      this.addClass(this.getElement(), 'formio-modified');
    });
  }

  setValue(value, flags) {
    if (this.isDateOnly) {
      return super.setValue(this.getDateOnlyValue(value), flags);
    }

    if (isString(value)) {
      const parsedDate = parseISO(value);

      if (isValid(parsedDate)) {
        value = parsedDate.toISOString().replace('.000Z', 'Z');
      } else if (!!value.trim()) {
        return;
      }
    } else if (isDate(value)) {
      value = value.toISOString().replace('.000Z', 'Z');
    }

    super.setValue(value, flags);
  }

  getValue() {
    const value = super.getValue();

    if (this.isDateOnly) {
      return this.getDateOnlyValue(value);
    }

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

  getDateOnlyValue(value) {
    if (Array.isArray(value)) {
      return value.map(date => this.getDateOnlyValue(date));
    }

    if (!value) {
      return null;
    }

    const date = isDate(value) ? value : parseISO(value);
    // Typed DATE attributes may arrive as midnight-Z; keep their calendar part.
    return isValid(date) ? (isString(value) ? value.substring(0, 10) : format(date, 'yyyy-MM-dd')) : null;
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
