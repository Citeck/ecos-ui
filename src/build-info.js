import packageJson from '../package.json';

const info = {
  time: new Date().toISOString(),
  version: packageJson.version
};

window.ECOS_UI_BUILD_INFO = info;

export default info;
