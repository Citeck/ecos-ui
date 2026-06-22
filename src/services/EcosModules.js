import Records from '@citeck/records-core';
import lodash from 'lodash';
import reactDefault, * as react from 'react';
import reactDomDefault, * as reactDom from 'react-dom';
import * as reactRedux from 'react-redux';
import * as redux from 'redux';
import reduxThunk from 'redux-thunk';

import * as util from '@/helpers/export/util';

const pageUtils = {
  goToDashboard: (recordRef, config) => {
    const navigator = window.Citeck.Navigator;

    if (navigator && navigator.goToDashboard) {
      return navigator.goToDashboard(recordRef, config);
    } else {
      window.open('/v2/dashboard?recordRef=' + recordRef);
    }
  }
};

export const modules = {
  react: { default: reactDefault, ...react },
  'react-dom': { default: reactDomDefault, ...reactDom },
  'react-redux': () => reactRedux,
  'redux-thunk': { default: reduxThunk, __esModule: true },
  redux: () => redux,
  moment: () => import('moment'),
  'ecos-modal': () => import('../components/common/EcosModal/CiteckEcosModal'),
  'ecos-records': () => Records,
  'ecos-form': () => import('@/components/forms/EcosForm/export'),
  'ecos-form-utils': () => import('@/components/forms/EcosForm/EcosFormUtils'),
  'idle-timer': () => import('@/components/common/IdleTimer'),
  'eform-locale-editor': () => import('@/components/forms/EcosForm/locale/FormLocaleEditorModal'),
  'eform-builder': () => import('@/components/forms/EcosForm/builder/EcosFormBuilderModal'),
  lodash: () => lodash,
  'record-actions': () => import('@/components/core/Records/actions/export/recordActions'),
  'dialog-manager': () => import('../components/common/dialogs/Manager'),
  'ecos-fetch': () => import('../helpers/ecosFetch'),
  'page-utils': pageUtils,
  'ecos-utils': { default: util, __esModule: true }
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
