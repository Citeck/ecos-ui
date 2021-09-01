import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { getTextByLocale } from '../helpers/util';
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

    return target;
  }

  static getMenuForWeb(firstLvl = []) {
    if (isEmpty(firstLvl)) {
      return [];
    }

    return firstLvl.map(item => {
      const target = {};

      target.id = DocAssociationsConverter.getId(item);
      target.label = getTextByLocale(item.name);
      target.items = item.journals.map(journal => ({ ...journal, associationId: item.id }));

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
}
