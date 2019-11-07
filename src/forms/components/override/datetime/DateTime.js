import FormIODateTimeComponent from 'formiojs/components/datetime/DateTime';

export default class DateTimeComponent extends FormIODateTimeComponent {
  // Cause: https://citeck.atlassian.net/browse/ECOSCOM-2673
  // пришлось отказаться от этого решения из-за бага https://citeck.atlassian.net/browse/ECOSCOM-2831
  // updateValue(flags, value) {
  //   const isChanged = super.updateValue(flags, value);
  //
  //   if (isChanged) {
  //     this.setPristine(false);
  //   }
  //
  //   return isChanged;
  // }
}
