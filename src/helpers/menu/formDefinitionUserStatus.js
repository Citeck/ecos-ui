import { t } from '../export/util';

const getForm = () => ({
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
        custom: `valid = moment(data.absenceBeginning).isBefore(value) ? true : '${t('modal.make-notavailable.end.error.big-date')}';`
      }
    },
    {
      key: 'autoAnswer',
      type: 'textarea',
      label: t('modal.make-notavailable.auto-answer.label'),
      labelPosition: 'left-left'
    }
  ]
});

export default getForm;
