import { IS_TEST_ENV } from '@/helpers/util';

let requireModules = {};

if (!IS_TEST_ENV) {
  const plugins = import.meta.glob('./**/*-plugin/index.[t|j]s', { eager: true });
  const modules = Object.values(plugins);

  modules.forEach(module => {
    if (module.__esModule || module[Symbol.toStringTag] === 'Module') {
      delete module.default;
    }

    requireModules = { ...requireModules, ...module };
  });
}

export default requireModules;
