import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { getTextByLocale, t } from '../helpers/util';
import { DIRECTIONS } from '../constants/docAssociations';
import DocumentsConverter from './documents';

export default class DocAssociationsConverter extends DocumentsConverter {
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

  static getId(source = {}) {
    return source.id;
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
        let attribute = column.attribute || '';

        if (!attribute) {
          return '';
        }

        if (attribute.charAt(0) === '.') {
          return `${column.name}:${attribute.slice(1)}`;
        }

        if (column.name) {
          if (attribute.includes('att(n:')) {
            return `${column.name}:${attribute}`;
          }

          return `${column.name}:att(n:"${attribute}"){disp}`;
        }

        return attribute || column.name;
      })
      .filter(item => !!item)
      .join(',');
  }
}
