import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { MENU_TYPE } from '../constants';
import { HandleControlTypes } from '../helpers/handleControl';
import { extractLabel } from '../helpers/util';

const getId = unique => `HEADER_${unique.replace(/-/g, '_').toUpperCase()}`;

export default class MenuConverter {
  static parseGetResult(source) {
    const target = {
      type: MENU_TYPE.LEFT,
      links: [],
      items: []
    };

    if (source) {
      target.type = source.type || MENU_TYPE.LEFT;
      target.links = source.links;
    }

    return target;
  }

  static getAvailableMenuItemsForWeb(items = []) {
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

    const { menuType, menuLinks } = source;

    target.type = menuType;
    target.links = MenuConverter.getMenuItemsForServer(menuLinks);

    return target;
  }

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
    return source.map(item => ({
      ...item,
      id: getId(`${item.siteId}_${item.type}`),
      label: extractLabel(item.label),
      targetUrl: get(item, 'config.uri'),
      target: get(item, 'config.target')
    }));
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
}
