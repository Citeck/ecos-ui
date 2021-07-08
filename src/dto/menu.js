import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { CreateMenuTypes, MenuTypes } from '../constants/menu';
import { HandleControlTypes } from '../helpers/handleControl';
import { extractLabel } from '../helpers/util';
import { treeFindFirstItem } from '../helpers/arrayOfObjects';
import { getIconRef } from '../helpers/icon';
import MenuSettingsService from '../services/MenuSettingsService';

const getId = unique => `HEADER_${unique.replace(/-/g, '_').toUpperCase()}`;

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

  static getAvailableSoloItemsForWeb(items = []) {
    return items.map(item => {
      return {
        label: item.label,
        link: item.link || '',
        id: item.id
      };
    });
  }

  static getMenuItemsForServer(items = []) {
    return items.map((item, index) => {
      return {
        label: item.label,
        position: index,
        link: item.link || '',
        id: item.id
      };
    });
  }

  static getSettingsConfigForServer(source) {
    const target = {};

    const { type } = source;

    target.type = type;

    return target;
  }

  /* menu create */
  static getCreateSiteItems(source = []) {
    const target = [];

    for (const site of source) {
      const items = [];

      for (const variant of site.createVariants) {
        if (!variant.canCreate) {
          continue;
        }
        const id = getId(`${site.siteId}_${variant.type}`);
        items.push({
          id,
          label: variant.title,
          control: {
            type: HandleControlTypes.ECOS_CREATE_VARIANT,
            payload: variant
          }
        });
      }

      const id = getId(site.siteId);
      target.push({ id, siteId: site.siteId, label: site.siteTitle, items });
    }

    return target;
  }

  static getCreateCustomItems(source = []) {
    return source.map(params => {
      const item = {
        ...params,
        id: getId(`${params.siteId}_${params.type}`),
        label: extractLabel(params.label)
      };

      if (params.type === CreateMenuTypes.Custom.LINK) {
        return {
          ...item,
          targetUrl: get(params, 'config.uri'),
          target: get(params, 'config.target')
        };
      }

      if (params.type === CreateMenuTypes.Custom.FORM) {
        return {
          ...item,
          control: {
            type: HandleControlTypes.ECOS_OPEN_FORM,
            payload: item.config
          }
        };
      }

      return item;
    });
  }

  static mergeCustomsAndSites(_customs, _sites) {
    const sites = cloneDeep(_sites);
    const exSiteId = [];

    _customs.forEach(item => {
      sites.forEach(site => {
        if (site.siteId === item.siteId) {
          exSiteId.push(item.siteId);
          site.items = [item, ...site.items];
        }
      });
    });

    const customs = _customs.filter(item => !exSiteId.includes(item.siteId));

    return { customs, sites };
  }

  /* menu settings */
  static getMenuItemsWeb(source) {
    const target = [];

    (function prepareTree(sItems, tItems, level) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const tItem = MenuSettingsService.getItemParams(sItem, { level });

        tItem.items = [];
        tItem.config = { ...sItem.config };
        tItem.label = get(sItem, '_remoteData_.label') || tItem.label;

        sItem.items && prepareTree(sItem.items, tItem.items, level + 1);

        delete sItem._remoteData_;
        tItems.push(tItem);
      }
    })(source, target, 0);

    return target;
  }

  static getMenuItemsServer(source) {
    const target = [];

    (function prepareTree(sItems, tItems) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const { dndIdx, locked, draggable, icon, ...newData } = sItem;
        const oldData = treeFindFirstItem({ items: source.originalItems, value: sItem.id, key: 'id' }) || {};
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
}
