import Input from '../../../common/form/Input';
import DatePicker from '../../../common/form/DatePicker';
import Select from '../../../common/form/Select';
import SelectJournal from '../../../common/form/SelectJournal';
import SelectOrgstruct from '../../../common/form/SelectOrgstruct';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER } from '../../../common/form/SelectOrgstruct/constants';
import { RecordService } from '../../../../api/recordService';
import { t } from '../../../../helpers/util';

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
export const PREDICATE_AND = 'and';
export const PREDICATE_OR = 'or';

export const ALFRESCO_EQUAL_PREDICATES_MAP = {
  [COLUMN_DATA_TYPE_TEXT]: 'string-contains',
  [COLUMN_DATA_TYPE_CONTENT]: 'string-contains',
  [COLUMN_DATA_TYPE_MLTEXT]: 'string-contains',
  [COLUMN_DATA_TYPE_INT]: 'number-equals',
  [COLUMN_DATA_TYPE_LONG]: 'number-equals',
  [COLUMN_DATA_TYPE_FLOAT]: 'number-equals',
  [COLUMN_DATA_TYPE_DOUBLE]: 'number-equals',
  [COLUMN_DATA_TYPE_DATE]: 'date-equals',
  [COLUMN_DATA_TYPE_DATETIME]: 'date-greater-or-equal',
  [COLUMN_DATA_TYPE_BOOLEAN]: 'boolean-true',
  [COLUMN_DATA_TYPE_QNAME]: 'type-equals',
  [COLUMN_DATA_TYPE_NODEREF]: 'noderef-contains',
  [COLUMN_DATA_TYPE_CATEGORY]: 'noderef-contains',
  [COLUMN_DATA_TYPE_ASSOC]: 'assoc-contains',
  [COLUMN_DATA_TYPE_OPTIONS]: 'string-contains',
  [COLUMN_DATA_TYPE_PERSON]: 'assoc-contains',
  [COLUMN_DATA_TYPE_AUTHORITY_GROUP]: 'assoc-contains',
  [COLUMN_DATA_TYPE_AUTHORITY]: 'assoc-contains'
};

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
  // [COLUMN_DATA_TYPE_DATE]: PREDICATE_EQ,
  // [COLUMN_DATA_TYPE_DATETIME]: PREDICATE_EQ,
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
    { value: PREDICATE_LT, label: t('predicate.lt'), needValue: true },
    { value: PREDICATE_AND, label: t('predicate.and'), needValue: true },
    { value: PREDICATE_OR, label: t('predicate.or'), needValue: true }
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
const PREDICATE_LIST_TYPE_OPTIONS = PREDICATE_LIST_TYPE_STRING;
const PREDICATE_LIST_TYPE_DATE = [PREDICATE_GE, PREDICATE_LT, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NODE_REF = [PREDICATE_CONTAINS, PREDICATE_NOT_CONTAINS, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NUMBER = [PREDICATE_EQ, PREDICATE_NOT_EQ, PREDICATE_LT, PREDICATE_LE, PREDICATE_GT, PREDICATE_GE];
const PREDICATE_LIST_TYPE_BOOLEAN = [PREDICATE_EQ, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NODEREF = [PREDICATE_EQ, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_QNAME = [PREDICATE_EQ, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_AUTHORITY = [PREDICATE_CONTAINS, PREDICATE_NOT_CONTAINS, PREDICATE_EMPTY, PREDICATE_NOT_EMPTY];
const PREDICATE_LIST_TYPE_NO_CONTROL_YET = [PREDICATE_NOT_EMPTY, PREDICATE_EMPTY];
const PREDICATE_LIST_TYPE_FILTER_GROUP = [PREDICATE_AND, PREDICATE_OR];

let allPredicates = [];
export function filterPredicates(filterArr) {
  if (!allPredicates.length) {
    allPredicates = getAllPredicates();
  }

  return filterArr.map(arrItem => allPredicates.find(item => item.value === arrItem));
}

export function getPredicates(field) {
  let type = field.type || COLUMN_DATA_TYPE_TEXT;

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
    case COLUMN_DATA_TYPE_DATETIME:
      return filterPredicates(PREDICATE_LIST_TYPE_DATE);

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

const recordServiceAPI = new RecordService();

export function getPredicateInput(field, sourceId, metaRecord) {
  const defaultValue = {
    label: t('react-select.default-value.label'),
    value: null
  };

  const booleanOptions = [
    defaultValue,
    { label: t('react-select.value-true.label'), value: true },
    { label: t('react-select.value-false.label'), value: false }
  ];

  const input = {
    component: Input,
    defaultValue: '',
    getProps: ({ predicateValue, changePredicateValue, applyFilters }) => ({
      className: 'ecos-input_narrow',
      value: predicateValue,
      onChange: function(e) {
        changePredicateValue(e.target.value);
      },
      onKeyDown: function(e) {
        if (e.key === 'Enter' && typeof applyFilters === 'function') {
          applyFilters();
        }
      }
    })
  };

  switch (field.type) {
    case COLUMN_DATA_TYPE_DATE:
    case COLUMN_DATA_TYPE_DATETIME:
      return {
        component: DatePicker,
        defaultValue: null, // new Date(),
        getProps: ({ predicateValue, changePredicateValue, datePickerWrapperClasses }) => ({
          className: 'ecos-input_narrow',
          wrapperClasses: datePickerWrapperClasses,
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
    case COLUMN_DATA_TYPE_NODEREF:
    case COLUMN_DATA_TYPE_QNAME:
      return input;
    case COLUMN_DATA_TYPE_OPTIONS:
      const loadOptions = () => {
        return new Promise(resolve => {
          recordServiceAPI
            .query({
              attributes: {
                opt: `#${field.attribute}?options`
              },
              record: metaRecord || `${sourceId || ''}@`
            })
            .then(record => record.attributes.opt || [])
            .then(opt =>
              opt.map(item => {
                return {
                  label: item.label || item.title,
                  value: item.value
                };
              })
            )
            .then(opt => {
              resolve([defaultValue, ...opt]);
            });
        });
      };

      return {
        component: Select,
        defaultValue: null,
        getProps: ({ predicateValue, changePredicateValue, selectClassName }) => ({
          className: `select_narrow ${selectClassName}`,
          placeholder: t('react-select.default-value.label'),
          cacheOptions: true,
          defaultOptions: true,
          isSearchable: false,
          loadOptions: loadOptions,
          defaultValue: defaultValue,
          value: predicateValue,
          handleSetValue: (value, options) => options.filter(o => o.value === value)[0],
          onChange: function(selected) {
            changePredicateValue(selected.value);
          }
        })
      };
    case COLUMN_DATA_TYPE_BOOLEAN:
      return {
        component: Select,
        defaultValue: null,
        getProps: ({ predicateValue, changePredicateValue }) => ({
          className: 'select_narrow',
          isSearchable: false,
          defaultValue: defaultValue,
          options: booleanOptions,
          onChange: function(selected) {
            changePredicateValue(selected.value);
          }
        })
      };
    case COLUMN_DATA_TYPE_ASSOC:
      return {
        component: SelectJournal,
        defaultValue: null,
        getProps: ({ predicateValue, changePredicateValue }) => ({
          isCompact: true,
          journalId: field.editorKey,
          defaultValue: predicateValue,
          onChange: function(value) {
            changePredicateValue(value);
          }
        })
      };
    case COLUMN_DATA_TYPE_PERSON:
    case COLUMN_DATA_TYPE_AUTHORITY:
    case COLUMN_DATA_TYPE_AUTHORITY_GROUP:
      let allowedAuthorityTypes = [AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER];
      if (field.type === COLUMN_DATA_TYPE_PERSON) {
        allowedAuthorityTypes = [AUTHORITY_TYPE_USER];
      } else if (field.type === COLUMN_DATA_TYPE_AUTHORITY_GROUP) {
        allowedAuthorityTypes = [AUTHORITY_TYPE_GROUP];
      }

      return {
        component: SelectOrgstruct,
        defaultValue: null,
        getProps: ({ predicateValue, changePredicateValue }) => ({
          isCompact: true,
          allowedAuthorityTypes,
          defaultValue: predicateValue,
          onChange: function(value) {
            changePredicateValue(value);
          }
        })
      };
    /* eslint-disable-next-line */
    default:
      return input;
  }
}
