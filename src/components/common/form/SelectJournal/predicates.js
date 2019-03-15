import Input from '../../../common/form/Input';
import DatePicker from '../../../common/form/DatePicker';
// import Select from '../../../common/form/Select';
// import SelectJournal from '../../../common/form/SelectJournal';
import { t } from '../../../../helpers/util';

const COLUMN_DATA_TYPE_STRING = 'java.lang.String';
const COLUMN_DATA_TYPE_DATE = 'java.util.Date';
const COLUMN_DATA_TYPE_NODE_REF = 'org.alfresco.service.cmr.repository.NodeRef';
// TODO COLUMN_DATA_TYPE_CATEGORY

const PREDICATE_CONTAINS = 'contains';
const PREDICATE_NOT_CONTAINS = 'not-contains';
const PREDICATE_EQ = 'eq';
const PREDICATE_NOT_EQ = 'not-eq';
const PREDICATE_STARTS = 'starts';
const PREDICATE_ENDS = 'ends';
const PREDICATE_EMPTY = 'empty';
const PREDICATE_NOT_EMPTY = 'not-empty';
const PREDICATE_GE = 'ge';
const PREDICATE_LT = 'lt';

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
    { value: PREDICATE_LT, label: t('predicate.lt'), needValue: true }
  ];
};

// TODO configure
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

let allPredicates = [];
function filterPredicates(filterArr) {
  if (!allPredicates.length) {
    allPredicates = getAllPredicates();
  }

  return filterArr.map(arrItem => allPredicates.find(item => item.value === arrItem));
}

export function getPredicates(fields) {
  switch (fields.javaClass) {
    case COLUMN_DATA_TYPE_NODE_REF:
      return filterPredicates(PREDICATE_LIST_TYPE_NODE_REF);
    case COLUMN_DATA_TYPE_DATE:
      return filterPredicates(PREDICATE_LIST_TYPE_DATE);
    case COLUMN_DATA_TYPE_STRING:
    default:
      return filterPredicates(PREDICATE_LIST_TYPE_STRING);
  }
}

export function getPredicateInput(fields) {
  switch (fields.javaClass) {
    case COLUMN_DATA_TYPE_DATE:
      return {
        component: DatePicker,
        defaultValue: null, // new Date(),
        getProps: ({ predicateValue, changePredicateValue }) => ({
          className: 'ecos-input_narrow',
          showIcon: true,
          selected: predicateValue,
          onChange: function(value) {
            changePredicateValue(value);
          }
        })
      };
    case COLUMN_DATA_TYPE_STRING:
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
    case COLUMN_DATA_TYPE_NODE_REF: // TODO
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
    // return {
    //   component: SelectJournal,
    //   defaultValue: [],
    //   getProps: ({ predicateValue, changePredicateValue }) => ({
    //     isCompact: true,
    //     journalId: 'legal-entities',
    //     value: predicateValue,
    //     onChange: function(value) {
    //       changePredicateValue(value);
    //     }
    //   })
    // };
    /* eslint-disable-next-line */
    default:
      return null;
  }
}
