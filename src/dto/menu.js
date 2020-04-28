import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { MenuTypes } from '../constants/menu';
import { CreateMenuTypes } from '../constants/menu';
import { HandleControlTypes } from '../helpers/handleControl';
import { extractLabel } from '../helpers/util';

const getId = unique => `HEADER_${unique.replace(/-/g, '_').toUpperCase()}`;

export default class MenuConverter {
  static parseGetResult(source) {
    const target = {
      type: MenuTypes.LEFT,
      links: [],
      items: []
    };

    if (source) {
      target.type = source.type || MenuTypes.LEFT;
      target.links = source.links;
      target.items = source.items;
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

    const { type, links } = source;

    target.type = type;
    target.links = MenuConverter.getMenuItemsForServer(links);

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
}
