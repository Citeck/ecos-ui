import set from 'lodash/set';
import BaseEditApi from 'formiojs/components/base/editForm/Base.edit.api';

const propertiesComponent = BaseEditApi.find(item => item.key === 'properties');

if (propertiesComponent) {
  propertiesComponent['valueComponent'] = {
    ...propertiesComponent['valueComponent'],
    label: {
      ru: 'Значение',
      en: 'Value'
    }
  };
}

const keyComponent = BaseEditApi.find(item => item.key === 'key');

set(keyComponent, 'validate.pattern', '(\\w|\\w[\\w-.:]*\\w)');
set(
  keyComponent,
  'validate.patternMessage',
  'The property name must only contain alphanumeric characters, underscores, dots, colons and dashes and should not be ended by dash or dot.'
);
set(keyComponent, 'isTypeahead', true);
set(
  keyComponent,
  'hintData.custom',
  `
const rootFormComponents = _.get(instance, 'root.options._webform.components') || [];

values = Object.keys(utils.flattenComponents(rootFormComponents));
`
);

export default BaseEditApi;
