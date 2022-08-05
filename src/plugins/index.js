const plugins = require.context('./', true, /-plugin\/index.js$/);

const modules = plugins.keys().map(plugins);

let requireModules = {};

modules.forEach(module => {
  if (module.__esModule || module[Symbol.toStringTag] === 'Module') {
    let name = module.default.constructor.name;

    if (name === 'Function') {
      name = module.default.name;
    }

    requireModules[name] = module.default;

    delete module.default;
  }

  requireModules = { ...requireModules, ...module };
});

export default requireModules;
