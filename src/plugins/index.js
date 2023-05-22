import { requireContextNodeJS } from '../components/Journals/service/formatters/registry/utils';
import { IS_TEST_ENV } from '../helpers/util';

let plugins;
if (IS_TEST_ENV) {
  plugins = requireContextNodeJS('./', true, /-plugin\/index.js$/);
} else {
  plugins = require.context('./', true, /-plugin\/index.js$/);
}

const modules = plugins.keys().map(plugins);

let requireModules = {};

modules.forEach(module => {
  if (module.__esModule || module[Symbol.toStringTag] === 'Module') {
    delete module.default;
  }

  requireModules = { ...requireModules, ...module };
});

export default requireModules;
