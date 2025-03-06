import isFunction from 'lodash/isFunction';
import BaseFormatter from '../BaseFormatter';

export const getAllFormattersModules = modules => {
  return Object.values(modules)
    .map(module => module.default)
    .filter(
      FormatterModule => Boolean(FormatterModule) && isFunction(FormatterModule) && FormatterModule.prototype instanceof BaseFormatter
    );
};
