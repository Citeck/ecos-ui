import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import moment from 'moment';

import { DIRECTIONS } from '../constants/docAssociations';

export default class DocAssociationsConverter {
  static getDocumentsForWeb(source, allowedConnections) {
    const keys = Object.keys(source);
    const target = [];

    if (isEmpty(keys)) {
      return target;
    }

    return keys.map(key => {
      const connection = allowedConnections.find(item => item.name === key);
      const direction = get(connection, 'direction', '');

      return {
        key,
        documents: get(source, key, []).map(item => DocAssociationsConverter.getDocumentForWeb(item, key, direction)),
        title: get(connection, 'title', '')
      };
    });
  }

  static getDocumentForWeb(source, connectionId, direction) {
    if (isEmpty(source)) {
      return {};
    }

    const target = {};

    target.name = source.displayName;
    target.date = moment(source.created || moment()).format('DD.MM.YYYY h:mm');
    target.record = source.id;
    target.connectionId = connectionId;
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

    const mappingNextLevel = (item, connectionId) => {
      const target = {};

      target.id = item.name;
      target.label = item.title;
      target.nodeRef = item.id;
      target.connectionId = connectionId;
      target.items = (item.items || []).map(i => ({ ...i, connectionId }));

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

  static getDocumentsRecords(documents = [], key) {
    return get(
      documents.find(doc => doc.key === key),
      ['documents'],
      []
    ).map(document => document.record);
  }

  static getDocumentsTotalCount(source = {}) {
    return Object.keys(source).reduce((result, key) => result + source[key].length, 0);
  }

  static getAssociationsByDirection(data = [], direction) {
    return data.map(association => ({ ...association, direction }));
  }

  static getDocumentsByDirection(data = []) {
    return data.reduce((result, current) => ({ ...result, ...current }), {});
  }

  static getAllowedConnections(data = []) {
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
