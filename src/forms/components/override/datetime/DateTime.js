import isEqual from 'lodash/isEqual';
import omitBy from 'lodash/omitBy';
import FormIODateTimeComponent from 'formiojs/components/datetime/DateTime';
import isEmpty from 'lodash/isEmpty';

export default class DateTimeComponent extends FormIODateTimeComponent {
  build(state) {
    super.build(state);

    this.widget.on('update', () => {
      this.setPristine(false);
      this.addClass(this.getElement(), 'formio-modified');
    });
  }

  static optimizeFormSchema(comp) {
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
