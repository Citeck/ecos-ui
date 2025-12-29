import lodashSet from 'lodash/set';

import FormatterRegistry from './FormatterRegistry';
import { getAllFormattersModules } from './utils';
const formatterRegistry = new FormatterRegistry();

const modules = import.meta.glob('./**/*Formatter.{ts,tsx,js,jsx}', { eager: true });
const formatterModules = getAllFormattersModules(modules);

for (const FormatterModule of formatterModules) {
  formatterRegistry.register(new FormatterModule());
}

lodashSet(window, 'Citeck.FormattersRegistry', formatterRegistry);

export default formatterRegistry;
