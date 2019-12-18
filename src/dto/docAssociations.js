import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import moment from 'moment';

export default class DocAssociationsConverter {
  static getDocumentsForWeb(source, allowedConnections) {
    const keys = Object.keys(source);
    const target = [];

    if (isEmpty(keys)) {
      return target;
    }

    return keys.map(key => ({
      key,
      documents: get(source, [key], []).map(item => DocAssociationsConverter.getDocumentForWeb(item, key)),
      title: get(allowedConnections.find(item => item.name === key), ['title'], '')
    }));
  }

  static getDocumentForWeb(source, connectionId) {
    if (isEmpty(source)) {
      return {};
    }

    const target = {};

    target.name = source.displayName;
    target.date = moment(source.created || moment()).format('DD.MM.YYYY h:mm');
    target.record = source.id;
    target.connectionId = connectionId;

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

  static getMenuForWeb(firstLvl, secondLvl) {
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

      target.id = item.name;
      target.label = item.title;
      target.items = (secondLvl || []).map(i => mappingNextLevel(i, item.name)).filter(i => i.items.length);

      return target;
    });
  }

  static getDocumentsRecords(documents = [], key) {
    return get(documents.find(doc => doc.key === key), ['documents'], []).map(document => document.record);
  }

  static getDocumentsTotalCount(data = {}) {
    return Object.keys(data).reduce((result, key) => result + data[key].length, 0);
  }

  static getAssociationsByDirection(data = [], direction) {
    return data.map(association => ({ ...association, direction }));
  }
}
