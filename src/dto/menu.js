import get from 'lodash/get';
import replace from 'lodash/replace';

import { SourcesId } from '../constants';
import { MenuSettings, MenuTypes } from '../constants/menu';
import { HandleControlTypes } from '../helpers/handleControl';
import { getTextByLocale } from '../helpers/util';
import { treeFindFirstItem } from '../helpers/arrayOfObjects';
import { getIconRef } from '../helpers/icon';
import MenuSettingsService from '../services/MenuSettingsService';
import MenuConverterExport from './export/menu';

export default class MenuConverter {
  /* menu config */
  static parseGetResult(source) {
    const target = {
      type: MenuTypes.LEFT
    };

    if (source) {
      target.id = source.id;
      target.version = source.version;
      target.configVersion = source.configVersion;
      target.type = source.type || MenuTypes.LEFT;
    }

    return target;
  }

  static getSettingsConfigForServer(source) {
    const target = {};

    const { type } = source;

    target.type = type;

    return target;
  }

  /* menu create */
  static getMainMenuCreateItems(source = []) {
    const ITs = MenuSettings.ItemTypes;

    return (function recursion(items) {
      return (items || [])
        .map((item = {}) => {
          const label = getTextByLocale(item.label);
          const option = { ...item, label };

          switch (item.type) {
            case ITs.LINK_CREATE_CASE:
              return MenuConverter.prepareLinkCreateCase(option);
            case ITs.ARBITRARY:
              option.disabled = !get(item, 'config.url');
              return { ...option, ...MenuConverter.getLinkMove(item) };
            case ITs.SECTION:
              option.disabled = !option.items.length;
              break;
            default:
              break;
          }

          option.items = recursion(item.items);

          return option;
        })
        .filter(item => !item.hidden);
    })(source);
  }

  static prepareCreateVariants(createVariants) {
    return createVariants.map(variant => ({
      type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
      label: getTextByLocale(variant.name),
      config: { variant }
    }));
  }

  /**
   * @deprecated
   * @description for supporting old menu where user can create lick create case with a few options
   * @param option from menu config
   * @returns Object
   */
  static prepareLinkCreateCase(option) {
    const createVariants = get(option, '_remoteData_.createVariants') || [];

    if (createVariants.length) {
      return {
        ...option,
        type: MenuSettings.ItemTypes.SECTION,
        items: MenuConverter.prepareCreateVariants(createVariants)
      };
    }

    return option;
  }

  /**
   * @deprecated
   * Use action goToPageSiteMenu ex: SiteMenu.handleClickItem
   * @param data
   * @returns Object
   */
  static getLinkMove(data) {
    const targetUrl = get(data, 'config.url') || {};

    return {
      targetUrl,
      control: {
        type: HandleControlTypes.ALF_NAVIGATE_TO_PAGE,
        payload: {
          url: targetUrl,
          target: targetUrl.includes('http') ? '_blank' : '_self'
        }
      }
    };
  }

  /* menu settings */
  static getMenuItemsWeb(source, params = {}) {
    const target = [];

    (function prepareTree(sItems, tItems, level) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const tItem = MenuSettingsService.getItemParams(sItem, { level, ...params });

        tItem.items = [];
        tItem.config = { ...sItem.config };
        tItem.label = MenuConverter.getSpecialLabel(sItem);

        sItem.items && prepareTree(sItem.items, tItem.items, level + 1);

        delete sItem._remoteData_;
        tItems.push(tItem);
      }
    })(source, target, 0);

    return target;
  }

  static getSpecialLabel(item) {
    let label = get(item, '_remoteData_.label') || item.label;

    switch (item.type) {
      case MenuSettings.ItemTypes.START_WORKFLOW:
        label = item.label || get(item, '_remoteData_.label') || replace(get(item, 'config.processDef'), SourcesId.BPMN_DEF, '');
        break;
      case MenuSettings.ItemTypes.JOURNAL:
        label = label || replace(get(item, 'config.recordRef'), SourcesId.JOURNAL, '');
        break;
      default:
        break;
    }

    return label;
  }

  static getMenuItemsServer(source) {
    const target = [];

    (function prepareTree(sItems, tItems) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const { dndIdx, locked, draggable, icon, ...newData } = sItem;
        const oldData = treeFindFirstItem({ items: source.originalItems || [], value: sItem.id, key: 'id' }) || {};
        const tItem = { ...oldData, ...newData, items: [] };

        tItem.icon = getIconRef(icon);

        sItem.items && prepareTree(sItem.items, tItem.items);

        tItems.push(tItem);
      }
    })(source.items, target);

    return target;
  }

  static getGroupPriorityConfigWeb(source) {
    const target = [];

    (function prepareTree(sItems, tItems) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const tItem = { ...sItem, items: [], draggable: true, badge: i + 1 };

        sItem.items && prepareTree(sItem.items, tItem.items);
        tItems.push(tItem);
      }
    })(source, target);

    return target;
  }

  static getGroupPriorityConfigServer(source) {
    const target = [];

    (function prepareTree(sItems, tItems) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const tItem = { id: sItem.id, items: [] };

        sItem.items && prepareTree(sItem.items, tItem.items);
        tItems.push(tItem);
      }
    })(source, target);

    return target;
  }

  static getAllSectionsFlat(source) {
    return MenuConverterExport.getAllSectionsFlat(source);
  }
}
