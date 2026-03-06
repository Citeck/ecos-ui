import packageJson from '../package.json';

const info = {
  time: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString(),
  version: packageJson.version
};

window.ECOS_UI_BUILD_INFO = info;

export default info;
