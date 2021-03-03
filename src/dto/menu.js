import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';

import { CreateMenuTypes, MenuSettings, MenuTypes } from '../constants/menu';
import { HandleControlTypes } from '../helpers/handleControl';
import { extractLabel, getTextByLocale } from '../helpers/util';
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

  static getMainMenuCreateItems(source = []) {
    const ITs = MenuSettings.ItemTypes;

    return (function recursion(items) {
      return (items || []).map(item => {
        const option = {
          ...item,
          label: getTextByLocale(item.label)
        };

        if (item.type === ITs.LINK_CREATE_CASE) {
          const createVariants = get(item, '_remoteData_.createVariants') || [];

          if (createVariants.length) {
            return {
              ...option,
              type: ITs.SECTION,
              items: recursion(MenuConverter.prepareCreateVariants(createVariants))
            };
          }

          return { ...option, ...MenuConverter.getLinkCreateCase(item) };
        }

        if (item.type === ITs.ARBITRARY) {
          return { ...option, ...MenuConverter.getLinkMove(item) };
        }

        option.items = recursion(item.items);
        option.disabled = !option.items.length;

        return option;
      });
    })(source);
  }

  static prepareCreateVariants(createVariants) {
    return createVariants.map(variant => ({
      type: MenuSettings.ItemTypes.LINK_CREATE_CASE,
      label: getTextByLocale(variant.name),
      config: { variant }
    }));
  }

  static getLinkCreateCase(data) {
    const variant = get(data, 'config.variant') || {};

    return {
      id: variant.id,
      control: {
        type: HandleControlTypes.ECOS_CREATE_VARIANT,
        payload: {
          title: getTextByLocale(variant.label),
          recordRef: variant.sourceId + '@',
          formId: variant.formRef,
          canCreate: true,
          postActionRef: variant.postActionRef,
          attributes: {
            _type: variant.typeRef,
            ...variant.attributes
          }
        }
      }
    };
  }

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
  static getMenuItemsWeb(source, params = {}) {
    const target = [];

    (function prepareTree(sItems, tItems, level) {
      for (let i = 0; i < sItems.length; i++) {
        const sItem = sItems[i];
        const tItem = MenuSettingsService.getItemParams(sItem, { level, ...params });

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
