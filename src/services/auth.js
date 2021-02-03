import Keycloak from 'keycloak-js';

import { CommonApi } from '../api/common';
import { setCookie } from '../helpers/util';
import { getHistory } from '../store';

const EIS_CONFIG_URL = '/eis.json';
const KC_TOKEN_COOKIE_NAME = 'PA';
const KC_DEFAULT_CLIENT_ID = 'web';
const KC_REALM_ID_DEFAULT_VALUE = 'REALM_ID';
const LS_KEY_REDIRECT_URI = 'kc-original-redirect_uri';

class AuthService {
  constructor() {
    this._kc = null;
    this._api = new CommonApi();
  }

  _loadConfig() {
    return this._api.getJson(EIS_CONFIG_URL).catch(() => ({
      realmId: process.env.REACT_APP_KEYCLOAK_CONFIG_REALM_ID || KC_REALM_ID_DEFAULT_VALUE,
      eisId: process.env.REACT_APP_KEYCLOAK_CONFIG_EIS_ID,
      logoutUrl: '/logout'
    }));
  }

  _saveToken = token => {
    setCookie(KC_TOKEN_COOKIE_NAME, token);
  };

  _saveOriginalRedirectUri = () => {
    localStorage.setItem(LS_KEY_REDIRECT_URI, window.location.href);
  };

  _restoreUri = () => {
    const uri = localStorage.getItem(LS_KEY_REDIRECT_URI);

    localStorage.removeItem(LS_KEY_REDIRECT_URI);

    if (!uri) {
      return;
    }

    const history = getHistory();
    history.replace(uri.replace(window.location.origin, ''));

    window.history.replaceState({ path: uri }, '', uri);
  };

  _getLoginOptions = (options = {}) => {
    this._saveOriginalRedirectUri();

    return {
      ...options,
      redirectUri: `${window.location.origin}/v2`
    };
  };

  init = () => {
    return this._loadConfig().then(eisConfig => {
      if (eisConfig.realmId === KC_REALM_ID_DEFAULT_VALUE) {
        return Promise.resolve();
      }

      const config = {
        url: `https://${eisConfig.eisId}/auth`,
        realm: eisConfig.realmId,
        clientId: process.env.REACT_APP_KEYCLOAK_CONFIG_CLIENT_ID || KC_DEFAULT_CLIENT_ID
      };

      this._kc = Keycloak(config);

      this._kc.onTokenExpired = () => {
        this._kc
          .updateToken()
          .then(isUpdated => {
            if (!isUpdated) {
              console.error('[kc] Failure to update token');
              return this._kc.login(this._getLoginOptions());
            }

            this._saveToken(this._kc.token);
          })
          .catch(e => {
            console.error('[kc] Failure to update token', e);
            this._kc.login(this._getLoginOptions());
          });
      };

      return this._kc
        .init({
          promiseType: 'native'
        })
        .then(isAuthenticated => {
          if (!isAuthenticated) {
            return this._kc.login(this._getLoginOptions());
          }

          this._restoreUri();

          this._saveToken(this._kc.token);
        })
        .catch(e => {
          console.error('[kc] Init error', e);
        });
    });
  };
}

export default new AuthService();
