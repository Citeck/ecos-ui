import { DEFAULT_THEME } from '../constants/theme';
import { getCurrentLocale, loadScript } from '../helpers/util';
import lodashSet from 'lodash/set';

export function fillConstants() {
  return new Promise(resolve => {
    const Alfresco = window.Alfresco;

    window.require(['/share/service/constants/Default.js'], function(constants) {
      Alfresco.constants = Alfresco.constants || {};

      for (let constant in constants) {
        if (!constants.hasOwnProperty(constant)) {
          continue;
        }
        Alfresco.constants[constant] = constants[constant];
      }

      resolve();
    });
  });
}

export function requireAdditionalScripts() {
  let requireOne = script =>
    new Promise(resolve => {
      let resolved = false;
      let localResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };
      setTimeout(localResolve, 2000);
      window.require([script], localResolve);
    });

  //DO NOT USE THIS DEPENDENCIES!
  return Promise.all(
    [
      '/share/res/js/bubbling.v2.1.js',
      '/share/res/js/forms-runtime.js',
      '/share/res/js/citeck/modules/utils/citeck.js',
      '/share/res/citeck/components/form/constraints.js'
    ].map(requireOne)
  ).then(() => {
    window.Alfresco.util.YUILoaderHelper.loadComponents(true);

    window.YAHOO.Bubbling.unsubscribe = function(layer, handler, scope) {
      this.bubble[layer].unsubscribe(handler, scope);
    };
  });
}

export function requireStyles(themeName) {
  let skinCss = `/share/res/themes/${themeName}/yui/assets/skin.css`;
  if (themeName === 'default') {
    skinCss = `/share/res/yui/assets/skins/default/skin.css`;
  }

  return new Promise(resolve => {
    window.require([`xstyle!${skinCss}`, `xstyle!/share/res/themes/${themeName}/presentation.css`], function() {
      resolve();
    });
  });
}

export function loadCoreScripts() {
  return new Promise(resolve => {
    loadScript(`/share/service/surf/dojo/bootstrap.js`, function() {
      if (window.dojoConfig) {
        window.dojoConfig.cacheBust = process.env.REACT_APP_BUILD_VERSION;

        loadScript(`/share/res/js/lib/dojo-1.10.4/dojo/dojo.js`, function() {
          loadScript(`/share/res/js/yui-common.js`, function() {
            if (!window.Alfresco || !window.Alfresco.messages) {
              lodashSet(window, 'Alfresco.messages', { global: null, scope: {} });
            }
            loadScript(`/share/service/messages.js?locale=${getCurrentLocale()}`, () => {
              loadScript(`/share/res/js/alfresco.js`, function() {
                resolve();
              });
            });
          });
        });
      }
    });
  });
}

export function loadLegacyMessages() {
  return new Promise(resolve => {
    if (!window.Alfresco || !window.Alfresco.messages) {
      lodashSet(window, 'Alfresco.messages', { global: null, scope: {} });
    }
    loadScript(`/share/service/messages.js?locale=${getCurrentLocale()}`, () => {
      resolve();
    });
  });
}

let isShareAssetsAlreadyLoaded = false;
export function requireShareAssets(themeName = DEFAULT_THEME) {
  if (isShareAssetsAlreadyLoaded) {
    return Promise.resolve();
  }

  return loadCoreScripts()
    .then(() => {
      return requireStyles(themeName);
    })
    .then(() => {
      return fillConstants();
    })
    .then(() => {
      isShareAssetsAlreadyLoaded = true;
      return requireAdditionalScripts();
    })
    .catch(e => {
      console.log('requireShareAssets error: ', e.message);
    });
}