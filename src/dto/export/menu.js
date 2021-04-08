import { MenuSettings } from '../../constants/menu';
import cloneDeep from 'lodash/cloneDeep';
import { extractLabel } from '../../helpers/util';

/**
 * Warning: imports should be as simple as possible to work with export
 */

export default class MenuConverter {
  static getAllSectionsFlat(source) {
    const target = [];

    (function prepareTree(sItems, breadcrumbs = '') {
      for (let i = 0; i < sItems.length; i++) {
        const { items, ...sItem } = sItems[i];

        if (sItem.type === MenuSettings.ItemTypes.SECTION) {
          const item = cloneDeep(sItem);
          item.breadcrumbs = breadcrumbs + extractLabel(item.label);
          target.push(item);
          Array.isArray(items) && prepareTree(items, item.breadcrumbs + ' / ');
        }
      }
    })(source);

    return target;
  }
}
