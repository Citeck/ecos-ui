import queryString from 'query-string';
import { URL_PAGECONTEXT } from '../../constants/alfresco';

const PREVIEW_KEY = 'preview';
const JOURNALS_LIST_ID_KEY = 'journalsListId';
const JOURNAL_ID_KEY = 'journalId';
const JOURNAL_SETTING_ID_KEY = 'journalSettingId';
const TYPE_KEY = 'type';
const DESTINATION_KEY = 'destination';

export const OLD_LINKS = true;

const getBool = str => str === 'true';

const getPredicateFilter = () => {
  return '';
};

const getCriteriaFilter = (row, columns) => {
  const criteria = [];
  const predicatesMap = {
    text: 'string-contains',
    mltext: 'string-contains',
    int: 'number-equals',
    long: 'number-equals',
    float: 'number-equals',
    double: 'number-equals',
    date: 'date-equals',
    datetime: 'date-greater-or-equal',
    boolean: 'boolean-true',
    qname: 'type-equals',
    noderef: 'noderef-contains',
    category: 'noderef-contains',
    assoc: 'assoc-contains',
    list: 'string-equals',
    type: 'type-equals',
    aspect: 'aspect-equals',
    path: 'path-equals',
    any: 'string-contains',
    options: 'string-contains',
    person: 'assoc-contains',
    authorityGroup: 'assoc-contains',
    authority: 'assoc-contains'
  };

  for (const key in row) {
    const value = row[key];
    const type = (columns.filter(c => c.attribute === key && c.visible && c.default)[0] || {}).type;
    const predicate = predicatesMap[type];

    if (predicate) {
      criteria.push({
        field: key,
        predicate: predicate,
        persistedValue: value
      });
    }
  }

  return criteria.length ? JSON.stringify({ criteria }) : '';
};

export const getFilter = (row, columns) => {
  return OLD_LINKS ? getCriteriaFilter(row, columns) : getPredicateFilter(row, columns);
};

export const getJournalPage = ({ journalsListId, journalId, journalSettingId, nodeRef, filter = '' }) => {
  const qString = queryString.stringify({
    [JOURNALS_LIST_ID_KEY]: journalsListId,
    [JOURNAL_ID_KEY]: journalId,
    [JOURNAL_SETTING_ID_KEY]: journalSettingId
  });

  return OLD_LINKS
    ? `${URL_PAGECONTEXT}journals2/list/tasks#journal=${nodeRef}&filter=${filter}&settings=&skipCount=0&maxItems=10`
    : `${URL_PAGECONTEXT}ui/journals?${qString}`;
};

export const goToJournalsPage = options => {
  const journalPageUrl = getJournalPage(options);

  window.open(journalPageUrl, '_blank');
};

export const getCreateRecord = ({ type, destination }) => {
  const qString = queryString.stringify({
    [TYPE_KEY]: type,
    [DESTINATION_KEY]: destination
  });

  return `${URL_PAGECONTEXT}node-create?${qString}&viewId=`;
};

export const goToCreateRecordPage = createVariants => {
  window.open(getCreateRecord(createVariants), '_blank');
};

export const getPreview = location => getBool(queryString.parse(location.search)[PREVIEW_KEY]);
export const getJournalsListId = location => queryString.parse(location.search)[JOURNALS_LIST_ID_KEY];
export const getJournalId = location => queryString.parse(location.search)[JOURNAL_ID_KEY];
export const getJournalSettingId = location => queryString.parse(location.search)[JOURNAL_SETTING_ID_KEY];

export const setPreview = (location, value) => {
  const params = queryString.parse(location.search);

  params[PREVIEW_KEY] = value;

  return `${location.pathname}?${queryString.stringify(params)}`;
};

export const setJournalsListId = (location, value) => {
  const params = queryString.parse(location.search);

  params[JOURNALS_LIST_ID_KEY] = value;

  return `${location.pathname}?${queryString.stringify(params)}`;
};

export const setJournalId = (location, value) => {
  const params = queryString.parse(location.search);

  params[JOURNAL_ID_KEY] = value;

  return `${location.pathname}?${queryString.stringify(params)}`;
};

export const setJournalSettingId = (location, value) => {
  const params = queryString.parse(location.search);

  params[JOURNAL_SETTING_ID_KEY] = value;

  return `${location.pathname}?${queryString.stringify(params)}`;
};
