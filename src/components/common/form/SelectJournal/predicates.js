import Input from '../../../common/form/Input';
import DatePicker from '../../../common/form/DatePicker';
// import Select from '../../../common/form/Select';
import SelectJournal from '../../../common/form/SelectJournal';
import { t } from '../../../../helpers/util';

export const COLUMN_DATA_TYPE_TEXT = 'text'; // +
export const COLUMN_DATA_TYPE_MLTEXT = 'mltext'; // +
export const COLUMN_DATA_TYPE_DATE = 'date'; // +
export const COLUMN_DATA_TYPE_DATETIME = 'datetime'; // +
export const COLUMN_DATA_TYPE_ASSOC = 'assoc'; // +
export const COLUMN_DATA_TYPE_CATEGORY = 'category'; // +
export const COLUMN_DATA_TYPE_CONTENT = 'content';
export const COLUMN_DATA_TYPE_INT = 'int'; // +-
export const COLUMN_DATA_TYPE_LONG = 'long'; // +-
export const COLUMN_DATA_TYPE_FLOAT = 'float'; // +-
export const COLUMN_DATA_TYPE_DOUBLE = 'double'; // +-
export const COLUMN_DATA_TYPE_BOOLEAN = 'boolean';
export const COLUMN_DATA_TYPE_QNAME = 'qname';
export const COLUMN_DATA_TYPE_NODEREF = 'noderef';
export const COLUMN_DATA_TYPE_OPTIONS = 'options';
export const COLUMN_DATA_TYPE_PERSON = 'person';
export const COLUMN_DATA_TYPE_AUTHORITY_GROUP = 'authorityGroup';
export const COLUMN_DATA_TYPE_AUTHORITY = 'authority';

export const PREDICATE_CONTAINS = 'contains';
export const PREDICATE_NOT_CONTAINS = 'not-contains';
export const PREDICATE_EQ = 'eq';
export const PREDICATE_NOT_EQ = 'not-eq';
export const PREDICATE_STARTS = 'starts';
export const PREDICATE_ENDS = 'ends';
export const PREDICATE_EMPTY = 'empty';
export const PREDICATE_NOT_EMPTY = 'not-empty';
export const PREDICATE_GE = 'ge';
export const PREDICATE_GT = 'gt';
export const PREDICATE_LE = 'le';
export const PREDICATE_LT = 'lt';

// Hack: Currently t('') works correctly only after execution loadMessagesAndAlfrescoScript function in share.js, so we should use function instead of array:
const getAllPredicates = function() {
  return [
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
    { value: PREDICATE_LT, label: t('predicate.lt'), needValue: true }
  ];
};

const PREDICATE_LIST_TYPE_STRING = [
  PREDICATE_CONTAINS,
  PREDICATE_EQ,
  PREDICATE_NOT_EQ,
  PREDICATE_STARTS,
  PREDICATE_ENDS,
  PREDICATE_EMPTY,
  PREDICATE_NOT_EMPTY
];
const PREDICATE_LIST_TYPE_DATE = [PREDICATE_GE, PREDICATE_LT, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NODE_REF = [PREDICATE_CONTAINS, PREDICATE_NOT_CONTAINS, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NUMBER = [PREDICATE_EQ, PREDICATE_NOT_EQ, PREDICATE_LT, PREDICATE_LE, PREDICATE_GT, PREDICATE_GE];
const PREDICATE_LIST_TYPE_BOOLEAN = [PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NO_CONTROL_YET = [PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];

let allPredicates = [];
function filterPredicates(filterArr) {
  if (!allPredicates.length) {
    allPredicates = getAllPredicates();
  }

  return filterArr.map(arrItem => allPredicates.find(item => item.value === arrItem));
}

export function getPredicates(field) {
  switch (field.type) {
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
    case COLUMN_DATA_TYPE_DATETIME:
      return filterPredicates(PREDICATE_LIST_TYPE_DATE);

    case COLUMN_DATA_TYPE_MLTEXT:
    case COLUMN_DATA_TYPE_TEXT:
    case COLUMN_DATA_TYPE_CATEGORY:
      return filterPredicates(PREDICATE_LIST_TYPE_STRING);

    default:
      return filterPredicates(PREDICATE_LIST_TYPE_NO_CONTROL_YET);
  }
}

export function getPredicateInput(field) {
  switch (field.type) {
    case COLUMN_DATA_TYPE_DATE:
    case COLUMN_DATA_TYPE_DATETIME:
      return {
        component: DatePicker,
        defaultValue: null, // new Date(),
        getProps: ({ predicateValue, changePredicateValue }) => ({
          className: 'ecos-input_narrow',
          showIcon: true,
          selected: predicateValue,
          onChange: function(value) {
            changePredicateValue(value);
          },
          showTimeInput: field.type === COLUMN_DATA_TYPE_DATETIME
        })
      };
    case COLUMN_DATA_TYPE_INT:
    case COLUMN_DATA_TYPE_DOUBLE:
    case COLUMN_DATA_TYPE_LONG:
    case COLUMN_DATA_TYPE_FLOAT:
    // TODO use input type number
    /* eslint-disable-next-line */
    case COLUMN_DATA_TYPE_MLTEXT:
    case COLUMN_DATA_TYPE_TEXT:
    case COLUMN_DATA_TYPE_CATEGORY:
      return {
        component: Input,
        defaultValue: '',
        getProps: ({ predicateValue, changePredicateValue, applyFilters }) => ({
          className: 'ecos-input_narrow',
          value: predicateValue,
          onChange: function(e) {
            changePredicateValue(e.target.value);
          },
          onKeyDown: function(e) {
            if (e.key === 'Enter') {
              applyFilters();
            }
          }
        })
      };
    case COLUMN_DATA_TYPE_OPTIONS:
      return null;
    // return {
    //   component: Select,
    //   defaultValue: null,
    //   getProps: ({ predicateValue, changePredicateValue }) => ({
    //     className: 'select_narrow',
    //     loadOptions: () => {console.log('loadOptions')}
    //     // value: predicateValue,
    //     // onChange: function(e) {
    //     //   changePredicateValue(e.target.value)
    //     // },
    //   }),
    // };
    case COLUMN_DATA_TYPE_ASSOC:
      return {
        component: SelectJournal,
        defaultValue: null,
        getProps: ({ predicateValue, changePredicateValue }) => ({
          isCompact: true,
          journalId: field.editorKey,
          // journalId: 'currency',
          value: predicateValue,
          onChange: function(value) {
            changePredicateValue(value);
          }
        })
      };
    /* eslint-disable-next-line */
    default:
      return null;
  }
}
