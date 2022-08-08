import { t } from '../../../../../helpers/export/util';

export default [
  {
    type: 'checkbox',
    input: true,
    key: 'import.enable',
    label: 'Add "Import" button',
    weight: 1,
    defaultValue: false
  },
  {
    type: 'panel',
    hideLabel: true,
    key: 'import.settings',
    conditional: {
      json: {
        and: [{ '==': [{ var: 'data.import.enable' }, true] }]
      }
    },
    components: [
      {
        type: 'textfield',
        label: {
          ru: 'URL для загрузки',
          en: 'Upload URL'
        },
        input: true,
        key: 'import.uploadUrl',
        validate: {
          required: true
        }
      },
      {
        type: 'textarea',
        label: {
          ru: 'Обработчик ответов',
          en: 'Response handler'
        },
        input: true,
        key: 'import.responseHandler',
        placeholder: 'result = resp.success ? resp.result : new Error(resp.errorMessage)',
        rows: 5,
        editor: 'ace',
        validate: {
          required: true
        }
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.html.import');
        }
      }
    ]
  }
];
