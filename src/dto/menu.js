import get from 'lodash/get';
import isObject from 'lodash/isObject';
import cloneDeep from 'lodash/cloneDeep';

import { SourcesId } from '../constants';
import { CreateMenuTypes, MenuTypes } from '../constants/menu';
import { HandleControlTypes } from '../helpers/handleControl';
import { extractLabel } from '../helpers/util';
import MenuSettingsService from '../services/MenuSettingsService';

const getId = unique => `HEADER_${unique.replace(/-/g, '_').toUpperCase()}`;

export default class MenuConverter {
  /* menu config */
  static parseGetResult(source) {
    const target = {
      type: MenuTypes.LEFT
    };

    if (source) {
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
  static getSettingsConfigWeb(source, params) {
    const { menu = {}, ...target } = source;
    const { type = MenuTypes.LEFT } = params;
    const sourceItems = get(menu, [type.toLowerCase(), 'items'], []);
    const targetItems = [];

    (function prepareTree(sItems, tItems) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const tItem = MenuSettingsService.getItemParams(sItem);

        sItem.items && prepareTree(sItem.items, tItem.items);
        tItems.push(tItem);
      }
    })(sourceItems, targetItems);

    target.items = targetItems;

    return target;
  }

  static getSettingsConfigServer(source) {
    const target = {
      items: []
    };

    (function prepareTree(sItems, tItems) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const { id, type, label, hidden, icon } = sItem;
        //todo merge old
        const tItem = { id, type, label, hidden, icon, items: [] };

        if (isObject(icon)) {
          const source = icon.type === 'img' ? SourcesId.ICON : SourcesId.FONT_ICON;
          const value = icon.value;

          tItem.icon = `${source}@${value}`;
        }

        sItem.items && prepareTree(sItem.items, tItem.items);

        tItems.push(tItem);
      }
    })(source.items, target.items);

    return target;
  }
}
