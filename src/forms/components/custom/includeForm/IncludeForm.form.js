import { t } from '../../../../helpers/export/util';

export default function() {
  return {
    components: [
      {
        weight: 0,
        label: {
          ru: 'HTML'
        },
        key: 'html',
        className: 'alert alert-info',
        get content() {
          return t('form-constructor.attention.include-form');
        },
        refreshOnChange: false,
        refreshOn: [],
        type: 'htmlelement',
        input: false
      },
      {
        weight: 10,
        label: {
          ru: 'Выберите форму',
          en: 'Select Form'
        },
        key: 'formRef',
        journalId: 'ecos-forms',
        refreshOn: [],
        type: 'selectJournal',
        input: true,
        queryData: '',
        validate: {
          required: true
        }
      }
    ]
  };
}
