import { t } from '../../../../../helpers/export/util';

export default [
  {
    type: 'panel',
    title: 'Display Actions',
    collapsible: true,
    collapsed: true,
    customClass: 'pt-1',
    key: 'displayElementsJS-js',
    components: [
      {
        type: 'checkbox',
        input: true,
        key: 'isUsedJournalActions',
        label: {
          ru: 'Использовать действия журнала',
          en: 'Use actions of journal'
        },
        tooltip: {
          ru: 'Если вы используете источник данных - Журнал, лучше использовать его действия',
          en: "If you use data source - Journal, it's better to use its actions"
        },
        defaultValue: false,
        calculateValue: "value = _.isEmpty(data.displayElementsJS) ? !!_.get(data, 'source.journal.journalId') : false",
        allowCalculateOverride: true,
        customClass: 'mb-2',
        logic: [
          {
            name: 'props',
            trigger: {
              type: 'javascript',
              javascript: "result =!_.get(data, 'source.journal.journalId')"
            },
            actions: [
              {
                name: 'setDisabled',
                type: 'property',
                property: {
                  label: 'Disabled',
                  value: 'disabled',
                  type: 'boolean'
                },
                state: 'true'
              }
            ]
          }
        ]
      },
      {
        type: 'textarea',
        key: 'displayElementsJS',
        rows: 5,
        editor: 'ace',
        label: {
          ru: 'Действия компонентов',
          en: 'Component Actions'
        },
        input: true,
        description: {
          ru: "Стандартные доступные действия в компоненте. Если вы используете действия журнала, все, кроме 'создать', будут отключены",
          en: "Standard available actions in component. If you use journal actions, every, except 'create', will be disable."
        }
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return t('form-constructor.html.table.conditional');
        }
      }
    ]
  },
  {
    type: 'panel',
    title: {
      ru: 'Настройка элементов',
      en: 'Setting Elements'
    },
    collapsible: true,
    collapsed: true,
    customClass: 'pt-1',
    key: 'settingElementsJS-js',
    components: [
      {
        type: 'checkbox',
        input: true,
        key: 'isInstantClone',
        label: {
          ru: 'Мгновенный клон',
          en: 'Instant Clone'
        },
        tooltip: {
          ru:
            'Если флаг установлен, запускается мгновенное добавление. Иначе, отображается форма создания и запись добавляется только после отправки',
          en: 'If flag is set, instant add runs, else form of create is shown and record is added only after submit'
        },
        weight: 1,
        defaultValue: false,
        customClass: 'pl-1'
      }
    ]
  }
];
