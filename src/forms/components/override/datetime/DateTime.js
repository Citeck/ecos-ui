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
    });
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

    super.setValue(value, flags);
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
