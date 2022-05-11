import set from 'lodash/set';
import BaseEditApi from 'formiojs/components/base/editForm/Base.edit.api';
import { getCurrentLocale } from '../../../../../helpers/util';
import i18next from '../../../../i18next';

BaseEditApi.splice(0, BaseEditApi.length);

const { translation } = i18next['options']['resources'][getCurrentLocale()];

const settings = [
  {
    weight: 0,
    type: 'textfield',
    input: true,
    key: 'key',
    label: translation['key'],
    tooltip: translation['key.tooltip'],
    validate: {
      pattern: '(\\w|\\w[\\w-.]*\\w)',
      patternMessage: translation['key.patternMessage']
    }
  },
  {
    weight: 100,
    type: 'tags',
    input: true,
    label: translation['tags'],
    storeas: 'array',
    tooltip: translation['tags.tooltip'],
    key: 'tags'
  },
  {
    weight: 200,
    type: 'datamap',
    label: translation['properties'],
    tooltip: translation['properties.tooltip'],
    key: 'properties',
    valueComponent: {
      type: 'textfield',
      key: 'value',
      label: translation['properties.label'],
      defaultValue: translation['properties.default-value'],
      input: true
    }
  }
];

settings.map(item => {
  return BaseEditApi.push(item);
});

const keyComponent = BaseEditApi.find(item => item.key === 'key');

set(keyComponent, 'validate.pattern', '(\\w|\\w[\\w-.:]*\\w)');
set(
  keyComponent,
  'validate.patternMessage',
  'The property name must only contain alphanumeric characters, underscores, dots, colons and dashes and should not be ended by dash or dot.'
);

export default BaseEditApi;
