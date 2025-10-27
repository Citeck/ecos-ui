import { t } from '@/helpers/util';

export const COLUMN_DATA_TYPE_TEXT = 'text';
export const COLUMN_DATA_TYPE_MLTEXT = 'mltext';
export const COLUMN_DATA_TYPE_DATE = 'date';
export const COLUMN_DATA_TYPE_DATETIME = 'datetime';
export const COLUMN_DATA_TYPE_ASSOC = 'assoc';
export const COLUMN_DATA_TYPE_CATEGORY = 'category';
export const COLUMN_DATA_TYPE_CONTENT = 'content';
export const COLUMN_DATA_TYPE_INT = 'int';
export const COLUMN_DATA_TYPE_LONG = 'long';
export const COLUMN_DATA_TYPE_FLOAT = 'float';
export const COLUMN_DATA_TYPE_DOUBLE = 'double';
export const COLUMN_DATA_TYPE_BOOLEAN = 'boolean';
export const COLUMN_DATA_TYPE_QNAME = 'qname';
export const COLUMN_DATA_TYPE_NODEREF = 'noderef';
export const COLUMN_DATA_TYPE_OPTIONS = 'options';
export const COLUMN_DATA_TYPE_PERSON = 'person';
export const COLUMN_DATA_TYPE_AUTHORITY_GROUP = 'authorityGroup';
export const COLUMN_DATA_TYPE_AUTHORITY = 'authority';
export const COLUMN_DATA_TYPE_FILTER_GROUP = 'filterGroup';

export const PREDICATE_ALL = 'all';
export const PREDICATE_CONTAINS = 'contains';
export const PREDICATE_IN = 'in';
export const PREDICATE_NOT_CONTAINS = 'not-contains';
export const PREDICATE_EQ = 'eq';
export const PREDICATE_NOT_EQ = 'not-eq';
export const PREDICATE_NOT = 'not';
export const PREDICATE_STARTS = 'starts';
export const PREDICATE_ENDS = 'ends';
export const PREDICATE_EMPTY = 'empty';
export const PREDICATE_NOT_EMPTY = 'not-empty';
export const PREDICATE_GE = 'ge';
export const PREDICATE_GT = 'gt';
export const PREDICATE_LE = 'le';
export const PREDICATE_LT = 'lt';
export const PREDICATE_AND = 'and';
export const PREDICATE_OR = 'or';
export const PREDICATE_TODAY = 'today';
export const PREDICATE_TIME_INTERVAL = 'time-interval';

export const EQUAL_PREDICATES_MAP = {
  [COLUMN_DATA_TYPE_TEXT]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_CONTENT]: PREDICATE_NOT_EMPTY,
  [COLUMN_DATA_TYPE_MLTEXT]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_INT]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_LONG]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_FLOAT]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_DOUBLE]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_DATE]: PREDICATE_GE,
  [COLUMN_DATA_TYPE_DATETIME]: PREDICATE_GE,
  [COLUMN_DATA_TYPE_BOOLEAN]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_QNAME]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_NODEREF]: PREDICATE_EQ,
  [PREDICATE_TODAY]: PREDICATE_EQ,
  [PREDICATE_TIME_INTERVAL]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_CATEGORY]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_ASSOC]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_OPTIONS]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_PERSON]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_AUTHORITY_GROUP]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_AUTHORITY]: PREDICATE_CONTAINS
};

export const SEARCH_EQUAL_PREDICATES_MAP = {
  [COLUMN_DATA_TYPE_TEXT]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_CONTENT]: PREDICATE_NOT_EMPTY,
  [COLUMN_DATA_TYPE_MLTEXT]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_INT]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_LONG]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_FLOAT]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_DOUBLE]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_DATE]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_DATETIME]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_BOOLEAN]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_QNAME]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_NODEREF]: PREDICATE_EQ,
  [COLUMN_DATA_TYPE_CATEGORY]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_ASSOC]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_OPTIONS]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_PERSON]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_AUTHORITY_GROUP]: PREDICATE_CONTAINS,
  [COLUMN_DATA_TYPE_AUTHORITY]: PREDICATE_CONTAINS
};

export const NUMBERS = [COLUMN_DATA_TYPE_INT, COLUMN_DATA_TYPE_DOUBLE, COLUMN_DATA_TYPE_LONG, COLUMN_DATA_TYPE_FLOAT];

const PREDICATE_LIST_TYPE_STRING = [
  PREDICATE_CONTAINS,
  PREDICATE_EQ,
  PREDICATE_NOT_EQ,
  PREDICATE_STARTS,
  PREDICATE_ENDS,
  PREDICATE_EMPTY,
  PREDICATE_NOT_EMPTY
];
const PREDICATE_LIST_TYPE_OPTIONS = PREDICATE_LIST_TYPE_STRING;
const PREDICATE_LIST_TYPE_DATE = [
  PREDICATE_EQ,
  PREDICATE_NOT_EQ,
  PREDICATE_GE,
  PREDICATE_LE,
  PREDICATE_EMPTY,
  PREDICATE_NOT_EMPTY,
  PREDICATE_TODAY,
  PREDICATE_TIME_INTERVAL
];
const PREDICATE_LIST_TYPE_DATETIME = [
  PREDICATE_GE,
  PREDICATE_LT,
  PREDICATE_EMPTY,
  PREDICATE_NOT_EMPTY,
  PREDICATE_TODAY,
  PREDICATE_TIME_INTERVAL
];
const PREDICATE_LIST_TYPE_NODE_REF = [PREDICATE_CONTAINS, PREDICATE_NOT_CONTAINS, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NUMBER = [PREDICATE_EQ, PREDICATE_NOT_EQ, PREDICATE_LT, PREDICATE_LE, PREDICATE_GT, PREDICATE_GE];
const PREDICATE_LIST_TYPE_BOOLEAN = [PREDICATE_EQ, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NODEREF = [PREDICATE_EQ, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_QNAME = [PREDICATE_EQ, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_AUTHORITY = [PREDICATE_CONTAINS, PREDICATE_NOT_CONTAINS, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NO_CONTROL_YET = [PREDICATE_ALL, PREDICATE_NOT_EMPTY, PREDICATE_EMPTY];
const PREDICATE_LIST_TYPE_FILTER_GROUP = [PREDICATE_AND, PREDICATE_OR];

export const PREDICATE_LIST_WITH_CLEARED_VALUES = [PREDICATE_TODAY, PREDICATE_TIME_INTERVAL];

let allPredicates = [];

// Hack: Currently t('') works correctly only after execution loadMessagesAndAlfrescoScript function in share.js, so we should use function instead of array:
const getAllPredicates = function () {
  return [
    { value: PREDICATE_ALL, label: t('predicate.all'), needValue: false },
    { value: PREDICATE_CONTAINS, label: t('predicate.contains'), needValue: true },
    { value: PREDICATE_NOT_CONTAINS, label: t('predicate.not-contains'), needValue: true },
    { value: PREDICATE_EQ, label: t('predicate.eq'), needValue: true },
    { value: PREDICATE_NOT_EQ, label: t('predicate.not-eq'), needValue: true },
    { value: PREDICATE_STARTS, label: t('predicate.starts'), needValue: true },
    { value: PREDICATE_ENDS, label: t('predicate.ends'), needValue: true },
    { value: PREDICATE_EMPTY, label: t('predicate.empty'), needValue: false },
    { value: PREDICATE_NOT_EMPTY, label: t('predicate.not-empty'), needValue: false },
    { value: PREDICATE_GE, label: t('predicate.ge'), needValue: true },
    { value: PREDICATE_GT, label: t('predicate.gt'), needValue: true },
    { value: PREDICATE_LE, label: t('predicate.le'), needValue: true },
    { value: PREDICATE_LT, label: t('predicate.lt'), needValue: true },
    { value: PREDICATE_AND, label: t('predicate.and'), needValue: true },
    { value: PREDICATE_OR, label: t('predicate.or'), needValue: true },
    { value: PREDICATE_TODAY, label: t('predicate.today'), needValue: false, fixedValue: datePredicateVariables.TODAY },
    { value: PREDICATE_TIME_INTERVAL, label: t('predicate.time-interval'), needValue: true }
  ];
};

export function getPredicate(value) {
  const allPredicates = getAllPredicates();
  const predicate = allPredicates.find(item => item.value === value);

  if (predicate === undefined || value === undefined) {
    return {};
  }

  return predicate;
}

export function getPredicateValue(predicate) {
  return predicate.t || predicate.value;
}

export function filterPredicates(filterArr) {
  if (!allPredicates.length) {
    allPredicates = getAllPredicates();
  }

  return filterArr.map(arrItem => {
    if (typeof arrItem === 'object') {
      return arrItem;
    }

    return allPredicates.find(item => item.value === arrItem);
  });
}

export function getPredicates(field) {
  const type = field.type || COLUMN_DATA_TYPE_TEXT;

  switch (type) {
    case COLUMN_DATA_TYPE_FILTER_GROUP:
      return filterPredicates(PREDICATE_LIST_TYPE_FILTER_GROUP);

    case COLUMN_DATA_TYPE_BOOLEAN:
      return filterPredicates(PREDICATE_LIST_TYPE_BOOLEAN);

    case COLUMN_DATA_TYPE_INT:
    case COLUMN_DATA_TYPE_DOUBLE:
    case COLUMN_DATA_TYPE_LONG:
    case COLUMN_DATA_TYPE_FLOAT:
      return filterPredicates(PREDICATE_LIST_TYPE_NUMBER);

    case COLUMN_DATA_TYPE_ASSOC:
      return filterPredicates(PREDICATE_LIST_TYPE_NODE_REF);

    case COLUMN_DATA_TYPE_DATE:
      return filterPredicates(PREDICATE_LIST_TYPE_DATE);
    case COLUMN_DATA_TYPE_DATETIME:
      return filterPredicates(PREDICATE_LIST_TYPE_DATETIME);

    case COLUMN_DATA_TYPE_OPTIONS:
      return filterPredicates(PREDICATE_LIST_TYPE_OPTIONS);

    case COLUMN_DATA_TYPE_MLTEXT:
    case COLUMN_DATA_TYPE_TEXT:
    case COLUMN_DATA_TYPE_CATEGORY:
      return filterPredicates(PREDICATE_LIST_TYPE_STRING);

    case COLUMN_DATA_TYPE_NODEREF:
      return filterPredicates(PREDICATE_LIST_TYPE_NODEREF);

    case COLUMN_DATA_TYPE_QNAME:
      return filterPredicates(PREDICATE_LIST_TYPE_QNAME);

    case COLUMN_DATA_TYPE_PERSON:
    case COLUMN_DATA_TYPE_AUTHORITY:
    case COLUMN_DATA_TYPE_AUTHORITY_GROUP:
      return filterPredicates(PREDICATE_LIST_TYPE_AUTHORITY);

    case COLUMN_DATA_TYPE_CONTENT:
    default:
      return filterPredicates(PREDICATE_LIST_TYPE_NO_CONTROL_YET);
  }
}

export const datePredicateVariables = {
  TODAY: '$TODAY',
  NOW: '$NOW',
  PERIOD: 'P',
  YEAR: 'Y',
  MONTH: 'M',
  WEEK: 'W',
  DAY: 'D',
  TIME_DESIGNATOR: 'T',
  HOUR: 'H',
  MINUTE: 'M',
  SECOND: 'S',
  INTERVAL_DELIMITER: '/'
};
