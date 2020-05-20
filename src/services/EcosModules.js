import reactDefault, * as react from 'react';
import reactDomDefault, * as reactDom from 'react-dom';
import Records from '../components/Records';
import lodash from 'lodash';
import '../build-info';
import reduxThunk from 'redux-thunk';
import * as redux from 'redux';
import * as reactRedux from 'react-redux';

export const modules = {
  react: { default: reactDefault, ...react },
  'react-dom': { default: reactDomDefault, ...reactDom },
  'react-redux': () => reactRedux,
  'redux-thunk': { default: reduxThunk, __esModule: true },
  redux: () => redux,
  moment: () => import('moment'),
  'ecos-modal': () => import('../components/common/EcosModal/CiteckEcosModal'),
  'ecos-records': () => Records,
  'ecos-form': () => import('../components/EcosForm/export'),
  'ecos-form-utils': () => import('../components/EcosForm/EcosFormUtils'),
  'idle-timer': () => import('../components/IdleTimer'),
  'eform-locale-editor': () => import('../components/EcosForm/locale/FormLocaleEditorModal'),
  'eform-builder': () => import('../components/EcosForm/builder/EcosFormBuilderModal'),
  lodash: () => lodash,
  'record-actions': () => import('../components/Records/actions/export/recordActions')
};

/**
 * Used in AMD modules. Example: require("ecosui!react", function () {...})
 */
class EcosModules {
  constructor() {
    this.cache = {};
  }

  loadModule(path, callback) {
    const key = path.replace(/\/.+/, '');

    const fromCache = this.cache[key];
    if (typeof fromCache !== 'undefined') {
      return fromCache;
    }

    const resolve = m => {
      this.cache[key] = m;
      callback(m);
    };

    let module = modules[key];
    if (module.call && module.apply) {
      module = module();
    }

    if (module && module.then) {
      module.then(resolve).catch(err => {
        console.error('ECOS UI Resource ' + path + 'is not found! Key: ' + key, err);
        resolve(null);
      });
    } else {
      resolve(module);
    }
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.Modules = window.Citeck.Modules || new EcosModules();

export default window.Citeck.Modules;
