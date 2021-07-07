import { t } from '../util';

export default {
  display: 'form',
  components: [
    {
      key: 'absenceBeginning',
      type: 'datetime',
      label: t('modal.make-notavailable.start.label'),
      labelPosition: 'left-left',
      format: 'yyyy-MM-dd H:mm',
      displayInTimezone: 'viewer',
      datepickerMode: 'day',
      customDefaultValue: 'value = moment();',
      datePicker: {
        minDate: 'moment()'
      },
      timePicker: {
        showMeridian: false
      }
    },
    {
      key: 'absenceEnd',
      type: 'datetime',
      label: t('modal.make-notavailable.end.label'),
      labelPosition: 'left-left',
      format: 'yyyy-MM-dd H:mm',
      displayInTimezone: 'viewer',
      datepickerMode: 'day',
      customDefaultValue: "value = moment().add(5, 'm');",
      datePicker: {
        minDate: "moment().add(1, 'm')"
      },
      timePicker: {
        showMeridian: false
      },
      validate: {
        required: true,
        custom: "valid = moment(data.dateTime2).isBefore(value) ? true : 'Дата начала не может быть больше даты окончания';"
      }
    },
    {
      key: 'autoAnswer',
      type: 'textarea',
      label: t('modal.make-notavailable.auto-answer.label'),
      labelPosition: 'left-left'
    }
  ]
};
