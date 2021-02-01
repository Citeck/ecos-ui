import Keycloak from 'keycloak-js';

import { CommonApi } from '../api/common';
import { setCookie } from '../helpers/util';

const EIS_CONFIG_URL = '/eis.json';
const KC_TOKEN_COOKIE_NAME = 'PA';
const KC_DEFAULT_CLIENT_ID = 'web';

class AuthService {
  constructor() {
    this._kc = null;
    this._api = new CommonApi();
  }

  _loadConfig() {
    return this._api.getJson(EIS_CONFIG_URL).catch(() => ({
      realmId: process.env.REACT_APP_KEYCLOAK_CONFIG_REALM_ID,
      eisId: process.env.REACT_APP_KEYCLOAK_CONFIG_EIS_ID,
      logoutUrl: '/logout'
    }));
  }

  _saveToken = token => {
    setCookie(KC_TOKEN_COOKIE_NAME, token);
  };

  init = () => {
    return this._loadConfig().then(eisConfig => {
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
              return this._kc.login();
            }
            this._saveToken(this._kc.token);
          })
          .catch(e => {
            console.error('[kc] Failure to update token', e);
            this._kc.login();
          });
      };

      return this._kc
        .init({
          promiseType: 'native'
        })
        .then(isAuthenticated => {
          if (!isAuthenticated) {
            return this._kc.login();
          }

          this._saveToken(this._kc.token);
        })
        .catch(e => {
          console.error('[kc] Init error', e);
        });
    });
  };
}

export default new AuthService();
