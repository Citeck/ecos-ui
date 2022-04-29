import TabsEditDisplay from 'formiojs/components/tabs/editForm/Tabs.edit.display';
import { t } from '../../../../../helpers/export/util';

const test = t('form-constructor.tabs-content.scrollableContent');

export default [
  {
    label: test,
    labelPosition: 'left-left',
    type: 'checkbox',
    input: true,
    key: 'scrollableContent',
    weight: 49,
    defaultValue: false
  },
  ...TabsEditDisplay
];
