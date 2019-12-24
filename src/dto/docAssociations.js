import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import moment from 'moment';

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

    const target = {};

    target.name = source.displayName;
    target.date = moment(source.created || moment()).format('DD.MM.YYYY h:mm');
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

    target.label = get(source, ['title'], '');
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
      target.label = item.title;
      target.nodeRef = item.id;
      target.associationId = associationId;
      target.items = (item.items || []).map(i => ({ ...i, associationId }));

      return target;
    };

    return firstLvl.map(item => {
      const target = {};

      target.id = item.id;
      target.label = item.name;
      target.items = secondLvl.map(i => mappingNextLevel(i, item.id)).filter(i => i.items.length);

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

      target.name = source.id;
      target.title = source.name;
      target.direction = source.direction === DIRECTIONS.NULL ? DIRECTIONS.TARGET : source.direction;

      return target;
    });
  }
}
