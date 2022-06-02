import { t } from '../../../../../helpers/export/util';

export default [
  {
    type: 'panel',
    title: 'DisplayElements',
    collapsible: true,
    collapsed: true,
    style: {
      'margin-bottom': '20px'
    },
    key: 'displayElementsJS-js',
    components: [
      {
        type: 'textarea',
        key: 'displayElementsJS',
        rows: 5,
        editor: 'ace',
        hideLabel: true,
        input: true
      },
      {
        type: 'htmlelement',
        tag: 'div',
        get content() {
          return `${t('form-constructor.panel.display-elements')}`;
        }
      }
    ]
  }
];
