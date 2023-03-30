import isFunction from 'lodash/isFunction';
import { IS_TEST_ENV } from '../../../../../helpers/util';
import BaseFormatter from '../BaseFormatter';

export const getAllFormattersModules = requireContextFunc => {
  return requireContextFunc
    .keys()
    .map(requireContextFunc)
    .map(FormatterModule => FormatterModule.default)
    .filter(
      FormatterModule => Boolean(FormatterModule) && isFunction(FormatterModule) && FormatterModule.prototype instanceof BaseFormatter
    );
};

export const requireContextNodeJS = (base, scanSubDirectories, regularExpression) => {
  if (!IS_TEST_ENV) {
    throw new Error("You should't call function requireContextNodeJS outside of NodeJS environmvent");
  }

  const fs = require('fs');
  const path = require('path');
  const files = {};

  function readDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
      const fullPath = path.resolve(directory, file);

      if (fs.statSync(fullPath).isDirectory()) {
        if (scanSubDirectories) readDirectory(fullPath);

        return;
      }

      if (!regularExpression.test(fullPath)) return;

      files[fullPath] = true;
    });
  }
  readDirectory(path.resolve(__dirname, base));

  function Module(file) {
    // IS_TEST_ENV is not used because of eslint
    if (process.env.NODE_ENV === 'test') {
      return require(file);
    }

    return;
  }

  Module.keys = () => Object.keys(files);

  return Module;
};
