import preval from 'preval.macro';
import packageJson from '../package.json';

const info = {
  time: preval`module.exports = new Date().toLocaleString()`,
  version: packageJson.version
};

window.ECOS_UI_BUILD_INFO = info;

export default info;
