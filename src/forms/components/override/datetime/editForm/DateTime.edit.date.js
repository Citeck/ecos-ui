import DateTimeEditDate from 'formiojs/components/datetime/editForm/DateTime.edit.date';

export default DateTimeEditDate.concat([
  {
    type: 'checkbox',
    input: true,
    key: 'ignoreTimeZone',
    label: 'Ignore time zone',
    defaultValue: false,
    tooltip: 'Check this if you would like to save fixed date with ignore timezone',
    description: "Option works if 'Date Input' is enabled and 'Time Input' is disabled"
  }
]);
