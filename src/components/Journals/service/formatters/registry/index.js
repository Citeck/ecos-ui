import lodashSet from 'lodash/set';
import FormatterRegistry from './FormatterRegistry';
import { getAllFormattersModules, requireContextNodeJS } from './utils';
import { IS_TEST_ENV } from '../../../../../helpers/util';

let modules;
if (IS_TEST_ENV) {
  modules = requireContextNodeJS('.', true, /Formatter.js$/);
} else {
  modules = require.context('.', true, /Formatter.js$/);
}

const formatterModules = getAllFormattersModules(modules);
const formatterRegistry = new FormatterRegistry();

for (const FormatterModule of formatterModules) {
  formatterRegistry.register(new FormatterModule());
}

lodashSet(window, 'Citeck.FormattersRegistry', formatterRegistry);

export default formatterRegistry;
