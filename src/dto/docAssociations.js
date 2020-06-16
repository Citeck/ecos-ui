import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { getTextByLocale, t } from '../helpers/util';
import { DIRECTIONS } from '../constants/docAssociations';

export default class DocAssociationsConverter {
  static getAssociationsForWeb(source, allowedAssociations) {
    const keys = Object.keys(source);
    const target = [];

    if (isEmpty(keys)) {
      return target;
    }

    return keys.map(key => {
      const connection = allowedAssociations.find(item => item.name === key);
      const direction = get(connection, 'direction', '');

      return {
        key,
        associations: get(source, key, []).map(item => DocAssociationsConverter.getAssociationForWeb(item, key, direction)),
        title: get(connection, 'title', '')
      };
    });
  }

  static getAssociationForWeb(source, associationId, direction) {
    if (isEmpty(source)) {
      return {};
    }

    const target = { ...source };

    target.record = source.id;
    target.associationId = associationId;
    target.direction = direction;

    return target;
  }

  static getJournalForWeb(source) {
    if (isEmpty(source)) {
      return {};
    }

    const target = {};

    target.label = getTextByLocale(get(source, ['title'], ''));
    target.id = get(source, ['type'], '');
    target.nodeRef = get(source, ['nodeRef'], '');

    return target;
  }

  static getMenuForWeb(firstLvl = [], secondLvl = []) {
    if (isEmpty(firstLvl)) {
      return [];
    }

    const mappingNextLevel = (item, associationId) => {
      const target = {};

      target.id = item.name;
      target.label = getTextByLocale(item.title);
      target.nodeRef = item.id;
      target.associationId = associationId;
      target.items = (item.items || []).map(i => ({ ...i, associationId }));

      return target;
    };

    return firstLvl.map(item => {
      const target = {};

      target.id = DocAssociationsConverter.getId(item);
      target.label = getTextByLocale(item.name);
      target.items = secondLvl.map(i => mappingNextLevel(i, target.id)).filter(i => i.items.length);

      return target;
    });
  }

  static getAssociationsTotalCount(source = {}) {
    return Object.keys(source).reduce((result, key) => result + source[key].length, 0);
  }

  static getAssociationsWithDirection(data = [], direction) {
    return data.map(association => ({ ...association, direction }));
  }

  static getAssociationsByDirection(data = []) {
    return data.reduce((result, current) => ({ ...result, ...current }), {});
  }

  static getAllowedAssociations(data = []) {
    if (isEmpty(data)) {
      return [];
    }

    return data.map((source = {}) => {
      const target = {};

      target.name = DocAssociationsConverter.getId(source);
      target.attribute = source.attribute;
      target.title = getTextByLocale(source.name);
      target.direction = source.direction === DIRECTIONS.NULL ? DIRECTIONS.TARGET : source.direction;
      target.columnsConfig = DocAssociationsConverter.getColumnsConfig(source.columnsConfig);

      return target;
    });
  }

  static getColumnsConfig(config) {
    if (config === null) {
      return null;
    }

    const target = { ...config };

    target.columns = get(config, 'columns', []).map(column => ({
      ...column,
      // attribute: column.attribute || column.name,
      // attribute: DocAssociationsConverter.getAttribute(column.attribute, column.name),
      label: t(getTextByLocale(column.label || ''))
    }));
    target.label = getTextByLocale(config.label);
    // target.typeRef = config.typeRef;

    return target;
  }

  static getId(source = {}) {
    return source.id;
  }

  static getAttribute(attr = '', name = '') {
    if (!name) {
      return attr;
    }

    if (attr.charAt(0) === '.') {
      return name;
    }

    if (attr.includes(':')) {
      return name;
      // return `${name}:${attr}`;
      // return attr.split(':')[0];
    }

    if (attr.includes('-')) {
      return attr.toLowerCase().replace(/\-/g, '_');
    }

    // if (name && (
    //   attr.charAt(0) === '.' ||
    //   attr.includes(':') ||
    //   attr.includes('-')
    // )) {
    //   return name;
    //   // return name;
    //   // return `_${source.slice(1)}`;
    // }

    return attr || name;
  }

  static getColumnsAttributes(source = []) {
    if (isEmpty(source)) {
      return '';
    }

    if (!Array.isArray(source)) {
      return '';
    }

    return source
      .map(column => {
        let attribute = column.attribute || ''; //  || column.name || '';

        if (!attribute) {
          return '';
        }

        if (!column.name) {
          return attribute;
        }

        if (attribute.charAt(0) === '.') {
          return `${column.name}:${column.attribute}`;
          // return `_${attribute.slice(1)}:${attribute}`;
        }

        if (attribute.includes(':')) {
          return `${column.name}:${column.attribute}`;
        }

        // if (attribute.includes('-')) {
        //   return column.name;
        // }

        // if ((
        //   attribute.includes(':') ||
        //   attribute.includes('-')
        // )) {
        //   return column.name;
        // }

        return attribute || column.name;

        // if (!column.name || !column.attribute) {
        //   return '';
        // }
        //
        // return `${column.name}:${column.attribute}`;
      })
      .filter(item => !!item)
      .join(',');
  }

  static getColumnForWeb(source = []) {
    if (isEmpty(source)) {
      return [];
    }

    if (!Array.isArray(source)) {
      return [];
    }

    return source.map(item => {
      return {
        ...item,
        dataField: DocAssociationsConverter.getAttribute(item.attribute, item.name),
        text: item.label
      };
    });
  }
}
