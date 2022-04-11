import { IS_TEST_ENV } from '../../helpers/util';
import { loadConfigs, saveConfig } from './configApi';
import _ from 'lodash';
import { URL } from '../../constants';

const LOCAL_STORAGE_KEY = 'ecos-ui-config';

const TYPE_JSON = 'JSON';
const TYPE_TEXT = 'TEXT';
const TYPE_NUMBER = 'NUMBER';
const TYPE_ASSOC = 'ASSOC';
const TYPE_BOOLEAN = 'BOOLEAN';
const TYPE_MLTEXT = 'MLTEXT';

/**
 * Max cache time determine time diff since last configs update when we should
 * perform force loading. Force loading mean that UI will wait until config will be updated.
 *
 * When user works with system cache will be updated every MIN_CACHE_TIME_MS
 * and force updating should not occurred. This will slightly increase page responsiveness.
 */
const MAX_CACHE_TIME_MS = 1800000; // 30 min
const MIN_CACHE_TIME_MS = 10000; // 10 sec

export const ACTIVE_THEME = 'active-theme';
export const TABS_ENABLED = 'tabs-enabled';

export const FOOTER_CONTENT = 'footer-content';

export const MAIN_MENU_TYPE = 'main-menu-type';
export const MENU_GROUP_PRIORITY = 'menu-group-priority';
export const CREATE_MENU_TYPE = 'create-menu-type';

export const ORGSTRUCT_ALL_USERS_GROUP_SHORT_NAME = 'orgstruct-allUsers-group-shortName';
export const ORGSTRUCT_SEARCH_USER_EXTRA_FIELDS = 'orgstruct-search-user-extra-fields';

export const RESTRICT_ACCESS_TO_EDIT_DASHBOARD = 'restrict-access-to-edit-dashboard';
export const HOME_LINK_URL = 'home-link-url';
export const LOGIN_PAGE_REDIRECT_URL = 'login-page-redirect-url';
export const CUSTOM_FEEDBACK_URL = 'custom-feedback-url';
export const CUSTOM_REPORT_ISSUE_URL = 'custom-report-issue-url';
export const SEPARATE_ACTION_LIST_FOR_QUERY = 'separate-action-list-for-query';
export const SITE_DASHBOARD_ENABLE = 'site-dashboard-enable';

const CONFIG_PROPS = {
  [MAIN_MENU_TYPE]: {
    defaultValue: 'left-v2'
  },
  [CREATE_MENU_TYPE]: {
    defaultValue: 'cascad'
  },
  [RESTRICT_ACCESS_TO_EDIT_DASHBOARD]: {
    defaultValue: true
  },
  [ORGSTRUCT_ALL_USERS_GROUP_SHORT_NAME]: {
    defaultValue: 'all'
  },
  [ACTIVE_THEME]: {
    defaultValue: 'ecos'
  },
  [FOOTER_CONTENT]: {
    defaultValue: ''
  },
  [HOME_LINK_URL]: {
    defaultValue: URL.DASHBOARD
  },
  [CUSTOM_FEEDBACK_URL]: {
    defaultValue: 'https://www.citeck.ru/feedback'
  },
  [CUSTOM_REPORT_ISSUE_URL]: {
    defaultValue:
      'mailto:support@citeck.ru?subject=Ошибка в работе Citeck ECOS: ' +
      'краткое описание&body=Summary: Короткое описание проблемы (продублировать в теме письма)' +
      '%0A%0ADescription:%0AПожалуйста, детально опишите возникшую проблему, последовательность ' +
      'действий, которая привела к ней. При необходимости приложите скриншоты.'
  },
  [SEPARATE_ACTION_LIST_FOR_QUERY]: {
    defaultValue: false
  },
  [LOGIN_PAGE_REDIRECT_URL]: {
    defaultValue: null,
    type: TYPE_TEXT
  },
  [SITE_DASHBOARD_ENABLE]: {
    defaultValue: false
  },
  [MENU_GROUP_PRIORITY]: {
    multiple: true,
    type: TYPE_ASSOC
  },
  [ORGSTRUCT_SEARCH_USER_EXTRA_FIELDS]: {
    multiple: true,
    type: TYPE_TEXT
  },
  [TABS_ENABLED]: {
    defaultValue: true
  }
};

/**
 * Configuration service with lazy loading.
 *
 * Main purpose of this service is optimization:
 * We will not wait every page update until configs will be loaded
 * 1. When cache should be updated we check how much time has passed since the last update
 *   and if it is not too much then we do update in background without blocking UI.
 * 2. All config requests will be batched in one request
 *
 * Second purpose is encapsulation of config API details.
 * Every part of system can call await ConfigService.getValue("abc")
 * without worrying about how exactly this config will be obtained.
 */
class ConfigService {
  constructor() {
    this._loadConfigsFunc = loadConfigs;
    if (IS_TEST_ENV) {
      this._loadConfigsFunc = async configsMap => {
        const result = {};
        for (let key in configsMap) {
          result[key] = null;
        }
        return result;
      };
    }

    const currentTime = new Date().getTime();

    let lsConfig = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    this._values = { ...(lsConfig.values || {}) };

    let timeSinceLastUpdate = currentTime - (lsConfig.lastUpdateTime || 0);
    for (let configKey in CONFIG_PROPS) {
      if (!this._values.hasOwnProperty(configKey)) {
        // if localStorage not contains some configs then we should update all configs
        timeSinceLastUpdate = MAX_CACHE_TIME_MS + 1;
        this._values = {};
        break;
      }
    }
    if (timeSinceLastUpdate < MIN_CACHE_TIME_MS) {
      return;
    }

    const configsToLoad = this._getConfigsToLoad();
    const loadedValuesPromise = this._loadConfigsFunc(configsToLoad).then(values => {
      const cfgValues = {};
      for (let configKey in values) {
        cfgValues[configKey] = {
          [configsToLoad[configKey]]: values[configKey]
        };
      }
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          values: cfgValues,
          lastUpdateTime: currentTime
        })
      );
      return values;
    });

    if (timeSinceLastUpdate > MAX_CACHE_TIME_MS) {
      for (let configKey in CONFIG_PROPS) {
        this._values[configKey] = loadedValuesPromise.then(values => {
          return this.setValue(configKey, values[configKey], CONFIG_PROPS[configKey]);
        });
      }
    } else {
      loadedValuesPromise.then(values => {
        if (values) {
          for (let configKey in values) {
            this.setValue(configKey, values[configKey], CONFIG_PROPS[configKey]);
          }
        }
      });
    }
  }

  async setServerValue(key, value, props) {
    const prevValue = this._values[key];
    let valueRes = this.setValue(key, value, props);
    try {
      await saveConfig(key, this.setValue(key, value, props));
    } catch (e) {
      this._values[key] = prevValue;
      throw e;
    }
    return valueRes;
  }

  setValue(key, value, props) {
    let newValue;
    const confProps = this._getConfigProps(props);
    if (this._isEmptyValue(value)) {
      newValue = confProps.defaultValue;
    } else {
      newValue = value;
    }
    this._values[key] = {
      ...(this._values[key] || {}),
      [this._getConfigAttribute(confProps)]: newValue
    };
    return newValue;
  }

  _isEmptyValue(value) {
    return value == null || value === '';
  }

  _getConfigsToLoad() {
    const configsToLoad = {};

    for (let configKey in CONFIG_PROPS) {
      const props = this._getConfigProps(CONFIG_PROPS[configKey]);
      configsToLoad[configKey] = this._getConfigAttribute(props);
    }
    return configsToLoad;
  }

  _getConfigProps(props, value) {
    const result = {
      ...(props || {})
    };
    if (result.type === undefined) {
      let valueToEvalType = value;
      if (valueToEvalType == null && result.defaultValue !== undefined) {
        valueToEvalType = result.defaultValue;
      }
      if (valueToEvalType == null || _.isString(valueToEvalType)) {
        result.type = TYPE_TEXT;
      } else if (_.isNumber(valueToEvalType)) {
        result.type = TYPE_NUMBER;
      } else if (_.isObject(valueToEvalType)) {
        result.type = TYPE_JSON;
      } else if (_.isBoolean(valueToEvalType)) {
        result.type = TYPE_BOOLEAN;
      } else {
        result.type = TYPE_TEXT;
      }
    }
    if (result.multiple === undefined) {
      result.multiple = Array.isArray(value);
    }
    if (result.defaultValue === undefined) {
      if (result.multiple) {
        result.defaultValue = [];
      } else if (result.type === TYPE_TEXT) {
        result.defaultValue = '';
      } else if (result.type === TYPE_NUMBER) {
        result.defaultValue = 0;
      } else if (result.type === TYPE_JSON) {
        result.defaultValue = {};
      } else if (result.type === TYPE_BOOLEAN) {
        result.defaultValue = false;
      } else {
        result.defaultValue = null;
      }
    }
    return result;
  }

  _getConfigAttribute(props) {
    let attribute = 'value';
    if (props.multiple) {
      attribute += '[]';
    }
    let scalar = '?str';
    if (props.type === TYPE_BOOLEAN) {
      scalar = '?bool';
    } else if (props.type === TYPE_NUMBER) {
      scalar = '?num';
    } else if (props.type === TYPE_ASSOC) {
      scalar = '?id';
    } else if (props.type === TYPE_JSON || props.type === TYPE_MLTEXT) {
      scalar = '?json';
    }
    return attribute + scalar;
  }

  async getValue(key, props) {
    const confProps = this._getConfigProps({
      ...(CONFIG_PROPS[key] || {}),
      ...(props || {})
    });
    const attribute = this._getConfigAttribute(confProps);
    const currentValue = this._values[key] || {};
    if (currentValue.hasOwnProperty(attribute)) {
      return currentValue[attribute];
    }
    return this._loadConfigsFunc({ [key]: attribute }).then(atts => {
      return this.setValue(key, atts.result, confProps);
    });
  }

  async getValues() {
    for (let key in this._values) {
      await this._values[key];
    }
    return this._values;
  }

  setLoadConfigFunction(loadConfigFunc) {
    this._loadConfigsFunc = loadConfigFunc;
  }
}

window.Citeck.ConfigService = new ConfigService();
export default window.Citeck.ConfigService;
