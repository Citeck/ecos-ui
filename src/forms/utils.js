import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import set from 'lodash/set';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';
import EditFormUtils from 'formiojs/components/base/editForm/utils';

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

/**
 * Processes the initial set of tabs, expanding / adding / removing some values
 * Values are stored by reference
 *
 * @param advancedConfig - what needs to be changed
 * @param tabsByKey - where to change, data source
 */
export const processEditFormConfig = (advancedConfig, tabsByKey) => {
  tabsByKey.forEach(tab => {
    tab.content.forEach(item => {
      const tabConfig = advancedConfig[tab.key];

      if (!tabConfig) {
        return;
      }

      const fields = Object.keys(tabConfig);

      if (fields.includes(item.key)) {
        const component = get(tabConfig, item.key, {});

        if (!component.onlyExpand) {
          set(tabConfig, 'components', tabConfig.components || []);
          tabConfig.components.push({ ...cloneDeep(item), ...component });
          item.ignore = true;

          return;
        }

        Object.keys(omit(component, ['onlyExpand'])).forEach(key => {
          item[key] = component[key];
        });
      }
    });
  });
};
