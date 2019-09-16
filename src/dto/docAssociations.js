import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import moment from 'moment';

export function getDocumentsForWeb(source, allowedConnections) {
  const keys = Object.keys(source);
  const target = [];

  if (isEmpty(keys)) {
    return target;
  }

  return keys.map(key => ({
    key,
    documents: get(source, [key], []).map(getDocumentForWeb),
    title: get(allowedConnections.find(item => item.name === key), ['title'], '')
  }));
}

export function getDocumentForWeb(source) {
  if (isEmpty(source)) {
    return {};
  }

  const target = {};

  target.name = source.displayName;
  target.date = moment(source.created || moment()).format('DD.MM.YYYY h:mm');
  target.record = source.id;

  return target;
}

export function getJournalForWeb(source) {
  if (isEmpty(source)) {
    return {};
  }

  const target = {};

  target.label = get(source, ['title'], '');
  target.id = get(source, ['type'], '');
  target.nodeRef = get(source, ['nodeRef'], '');

  return target;
}

export function getMenuForWeb(firstLvl, secondLvl) {
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
