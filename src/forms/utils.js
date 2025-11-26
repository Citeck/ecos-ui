import BaseEditApi from 'formiojs/components/base/editForm/Base.edit.api';
import BaseEditConditional from 'formiojs/components/base/editForm/Base.edit.conditional';
import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';
import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';
import BaseEditLogic from 'formiojs/components/base/editForm/Base.edit.logic';
import BaseEditValidation from 'formiojs/components/base/editForm/Base.edit.validation';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import omit from 'lodash/omit';
import set from 'lodash/set';

import Formio from './Formio';

import { getCompDoc } from '@/constants/documentation';

export function findUploadDocsService() {
  let uploadService = null;

  this.root.everyComponent(comp => {
    if (comp._uploadDocsRefService) {
      uploadService = comp._uploadDocsRefService;
    }
  });

  return uploadService;
}

export const checkIsEmptyMlField = field => {
  if ((typeof field === 'string' && isEmpty(field)) || isNil(field)) {
    return true;
  }

  const keys = Object.keys(field);

  if (typeof field === 'object') {
    if (isEmpty(field)) {
      return true;
    }

    return !keys
      .map(key => {
        if (field[key] === undefined) {
          return true;
        }

        if (typeof field[key] === 'string') {
          return isEmpty(field[key]);
        }

        if (typeof field[key] === 'object') {
          return checkIsEmptyMlField(field[key]);
        }

        return false;
      })
      .includes(false);
  }

  return false;
};

// config for Base tab (a new tab consisting of parts of other tabs)
const getBaseTabConfig = () => ({
  display: {
    label: { weight: 0 },
    hideLabel: { weight: 200 },
    tooltip: { weight: 400 },
    multiple: { weight: 500 },
    disabled: { weight: 600 },
    hidden: { weight: 700 },
    isSelectedValueAsText: { weight: 300 },
    action: { weight: 110 },
    state: { weight: 111 },
    showValidations: { weight: 112 },
    event: { weight: 113 },
    custom: { weight: 114 },
    url: { weight: 115 },
    headers: { weight: 116 }
  },
  api: {
    key: { weight: 100 }
  },
  validation: {
    'validate.required': { weight: 800 }
  },
  conditional: {
    'simple-conditional': { weight: 900 }
  }
});

export const runTransform = (config, tabs) => {
  const advancedConfig = config || getBaseTabConfig();
  const tabsByKey = tabs || [
    { key: 'display', components: cloneDeep(BaseEditDisplay) },
    { key: 'data', components: cloneDeep(BaseEditData) },
    { key: 'logic', components: cloneDeep(BaseEditLogic) },
    { key: 'api', components: cloneDeep(BaseEditApi) },
    { key: 'validation', components: cloneDeep(BaseEditValidation) },
    { key: 'conditional', components: cloneDeep(BaseEditConditional) }
  ];

  return { config: advancedConfig, tabsByKey: processEditFormConfig(advancedConfig, tabsByKey) };
};

const _removeDuplicateComponents = (components = []) => {
  if (!Array.isArray(components)) {
    return components;
  }

  return [
    ...new Set(
      components.map(component => {
        if (Array.isArray(component.components)) {
          component.components = _removeDuplicateComponents(component.components);
        }

        return component;
      })
    )
  ];
};

const _expandEditForm = component => {
  const ignoredComponents = ['recaptcha', 'custom', 'horizontalLine', 'asyncData'];

  if (ignoredComponents.includes(component.type)) {
    return component;
  }

  const originEditForm = component.editForm;

  component.editForm = function (...extend) {
    let originTabs = get(originEditForm(), 'components.0.components', []);
    const { config, tabsByKey } = runTransform(null, cloneDeep(originTabs));

    const editFormSectionBasic = {
      key: 'basic',
      label: 'Basic',
      weight: 0,
      components: [
        ...get(config, 'display.components', []),
        ...get(config, 'api.components', []),
        ...get(config, 'validation.components', []),
        ...get(config, 'conditional.components', [])
      ]
    };
    const removed = tabsByKey.map(item => ({
      key: item.key,
      ignore: true
    }));

    originTabs = originTabs.map(item => ({
      ...omit(item, ['components']),
      key: `${item.key}-reworked`
    }));

    const result = originEditForm([
      ...extend,
      editFormSectionBasic,
      ...removed,
      ...originTabs,
      ...tabsByKey.map(item => ({
        ...item,
        key: `${item.key}-reworked`
      }))
    ]);

    const tabs = result.components ? result.components.find(item => item.type === 'tabs') : {};
    const filtered = tabs && tabs.components ? tabs.components.filter(item => item.key !== 'condition-reworked') : [];

    if (tabs && filtered) {
      tabs.components = filtered;
    } else {
      return result;
    }

    const basic = tabs.components && tabs.components.find(item => item.key === 'basic');
    const simpleLogic = basic && basic.components ? basic.components.find(item => item.key === 'simple-conditional') : {};

    if (tabs && basic && simpleLogic) {
      basic.components = basic.components.filter(item => item.key !== 'simple-conditional');
      const display = tabs.components.find(item => item.key === 'conditional-reworked');
      if (display && display.components.length) {
        display.components.unshift(simpleLogic);
      }
    }

    _removeDuplicateComponents(get(result, 'components.0.components', []));

    return result;
  };

  return component;
};

export const disabledComponents = Object.freeze([
  'password',
  'selectboxes',
  'time',
  'select',
  'radio',
  'content',
  'modaledit',
  'tags',
  'currency',
  'resource',
  'signature',
  'survey',
  'location',
  'recaptcha',
  'fieldset',
  'well',
  'editgrid',
  'nested',
  'form',
  'unknown'
]);

export const prepareComponentBuilderInfo = builderInfo => {
  const groups = {
    basic: ['textfield', 'number', 'textarea', 'checkbox', 'ecosSelect', 'button', 'selectJournal', 'selectOrgstruct', 'datetime', 'day'],
    advanced: [
      'mlText',
      'taskOutcome',
      'mlTextarea',
      'selectAction',
      'tableForm',
      'email',
      'url',
      'phoneNumber',
      'address',
      'htmlelement',
      'file',
      'importButton'
    ],
    layout: ['horizontalLine', 'columns', 'panel', 'tableForm', 'tabs'],
    data: ['hidden', 'asyncData', 'container', 'datagrid', 'datagridAssoc', 'datamap']
  };

  if (!builderInfo || !builderInfo.key) {
    return;
  }

  if (disabledComponents.includes(builderInfo.key)) {
    return;
  }

  Object.keys(groups).some(key => {
    if (groups[key].includes(builderInfo.key)) {
      builderInfo.group = key;

      return true;
    }

    return false;
  });

  return builderInfo;
};

export const prepareComponents = components => {
  Object.keys(components).forEach(key => {
    const component = components[key];
    const builderInfo = component.builderInfo || {};

    Object.defineProperty(component, 'builderInfo', {
      get: function () {
        //set doc-url for all who has documentation in different service
        return { ...builderInfo, documentation: getCompDoc(key) || builderInfo.documentation };
      },
      configurable: true
    });

    _expandEditForm(component);
  });

  return components;
};

/**
 * Processes the initial set of tabs, expanding / adding / removing some values
 * Values are stored by reference
 *
 * @param advancedConfig - what needs to be changed
 * @param tabsByKey - where to change, data source
 */
export const processEditFormConfig = (advancedConfig, tabsByKey) => {
  tabsByKey = tabsByKey.map(tab => {
    tab.components = tab.components
      .map(item => {
        const tabConfig = advancedConfig[tab.key];

        if (!tabConfig) {
          return item;
        }

        const fields = Object.keys(omit(tabConfig, ['components']));

        if (fields.includes(item.key)) {
          const component = get(tabConfig, item.key, {});

          if (!component.onlyExpand) {
            set(tabConfig, 'components', tabConfig.components || []);
            tabConfig.components.push({ ...item, ...component });

            return null;
          }
        }

        return item;
      })
      .filter(item => item !== null);

    return tab;
  });

  return tabsByKey;
};

/**
 * Changing the configuration of a component by reference
 * @param {Array} components
 * @param {String} componentKey
 * @param {Object} newConfig
 */
export const replaceComponentConfig = (components = [], componentKey = '', newConfig = {}) => {
  if (isEmpty(components) || isEmpty(componentKey)) {
    return;
  }

  const component = components.find(item => item.key === componentKey);

  if (isEmpty(component)) {
    return;
  }

  for (const key in newConfig) {
    component[key] = newConfig[key];
  }
};

export const clearFormFromCache = formId => {
  delete Formio.forms[formId];
};
