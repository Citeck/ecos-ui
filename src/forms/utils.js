import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import set from 'lodash/set';
import omit from 'lodash/omit';
import cloneDeep from 'lodash/cloneDeep';

import BaseEditDisplay from 'formiojs/components/base/editForm/Base.edit.display';
import BaseEditData from 'formiojs/components/base/editForm/Base.edit.data';
import BaseEditLogic from 'formiojs/components/base/editForm/Base.edit.logic';
import BaseEditApi from 'formiojs/components/base/editForm/Base.edit.api';
import BaseEditValidation from 'formiojs/components/base/editForm/Base.edit.validation';
import BaseEditConditional from 'formiojs/components/base/editForm/Base.edit.conditional';

export const checkIsEmptyMlField = field => {
  if ((typeof field === 'string' && isEmpty(field)) || field === undefined) {
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

export const runTransform = (config, tabs) => {
  const advancedConfig = config || {
    display: {
      label: { weight: 0 },
      hideLabel: { weight: 200 },
      tooltip: { weight: 400 },
      multiple: { weight: 500 },
      disabled: { weight: 600 },
      hidden: { weight: 700 },
      isSelectedValueAsText: { weight: 300 }
    },
    api: {
      key: { weight: 100 }
    },
    validation: {
      'validate.required': { weight: 800 }
    },
    conditional: {
      'simple-conditional': { weight: 900 },
      customConditionalPanel: { onlyExpand: true, collapsed: false, test: true }
    }
  };
  const tabsByKey = tabs || [
    { key: 'display', components: cloneDeep(BaseEditDisplay) },
    { key: 'data', components: cloneDeep(BaseEditData) },
    { key: 'logic', components: cloneDeep(BaseEditLogic) },
    { key: 'api', components: cloneDeep(BaseEditApi) },
    { key: 'validation', components: cloneDeep(BaseEditValidation) },
    { key: 'conditional', components: cloneDeep(BaseEditConditional) }
  ];

  processEditFormConfig(advancedConfig, tabsByKey);

  return { config: advancedConfig, tabsByKey };
};

export const prepareComponents = components => {
  const ignoredComponents = ['recaptcha', 'custom', 'horizontalLine', 'asyncData'];

  Object.keys(components)
    .filter(key => !ignoredComponents.includes(key))
    .forEach(key => {
      const component = components[key];
      const originEditForm = component.editForm;

      component.editForm = function(...extend) {
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

        console.warn({
          config,
          tabsByKey,
          originTabs,
          df: cloneDeep(originTabs)
        });

        originTabs = originTabs.map(item => ({
          ...omit(item, ['components']),
          key: `${item.key}-reworked`
        }));

        return originEditForm([
          ...extend,
          editFormSectionBasic,
          ...removed,
          ...originTabs,
          ...tabsByKey.map(item => ({
            ...item,
            key: `${item.key}-reworked`
          }))
        ]);
      };
    });

  // console.warn({ components });

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
  tabsByKey.forEach(tab => {
    tab.components.forEach((item, index) => {
      const tabConfig = advancedConfig[tab.key];

      if (!tabConfig) {
        return;
      }

      const fields = Object.keys(omit(tabConfig, ['components']));

      if (item.key === 'customConditionalPanel') {
        const component = get(tabConfig, item.key, {});

        console.warn({ component });

        Object.keys(component).forEach(key => {
          item[key] = component[key];
        });
      }

      if (fields.includes(item.key)) {
        const component = get(tabConfig, item.key, {});

        if (!component.onlyExpand) {
          set(tabConfig, 'components', tabConfig.components || []);
          tabConfig.components.push({ ...item, ...component });
          tab.components.splice(index, 1);

          return;
        }

        // console.warn({ item, component });

        Object.keys(omit(component, ['onlyExpand'])).forEach(key => {
          item[key] = component[key];
        });

        return;
      }

      // console.warn({ item, tabConfig });
    });
  });

  console.warn({ tabsByKey });

  return tabsByKey;
};
