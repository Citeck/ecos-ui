import _ from 'lodash';
import moment from 'moment';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';

import { extractLabel } from '../../../helpers/util';
import { t } from '../../../helpers/export/util';
import { DatePicker, Input, Select, SelectJournal, SelectOrgstruct } from '../../common/form';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER } from '../../common/form/SelectOrgstruct/constants';
import { Predicates } from '../../Records/predicates';
import { MapBooleanValues } from '../utils/maps';
import {
  COLUMN_DATA_TYPE_TEXT,
  COLUMN_DATA_TYPE_MLTEXT,
  COLUMN_DATA_TYPE_DATE,
  COLUMN_DATA_TYPE_DATETIME,
  COLUMN_DATA_TYPE_ASSOC,
  COLUMN_DATA_TYPE_CATEGORY,
  COLUMN_DATA_TYPE_INT,
  COLUMN_DATA_TYPE_LONG,
  COLUMN_DATA_TYPE_FLOAT,
  COLUMN_DATA_TYPE_DOUBLE,
  COLUMN_DATA_TYPE_BOOLEAN,
  COLUMN_DATA_TYPE_QNAME,
  COLUMN_DATA_TYPE_NODEREF,
  COLUMN_DATA_TYPE_OPTIONS,
  COLUMN_DATA_TYPE_PERSON,
  COLUMN_DATA_TYPE_AUTHORITY_GROUP,
  COLUMN_DATA_TYPE_AUTHORITY,
  PREDICATE_TIME_INTERVAL
} from './predicates';
import Records from '../Records';

export const convertValueByType = (type, value) => {
  switch (type) {
    case Predicates.COLUMN_DATA_TYPE_INT:
      const int = Number(value);
      return _.isNil(value) || Number.isNaN(int) ? null : parseInt(String(int));
    case Predicates.COLUMN_DATA_TYPE_LONG:
    case Predicates.COLUMN_DATA_TYPE_FLOAT:
    case Predicates.COLUMN_DATA_TYPE_DOUBLE:
      const float = Number(value);
      return _.isNil(value) || Number.isNaN(float) ? null : float;
    case Predicates.COLUMN_DATA_TYPE_BOOLEAN:
      const found = _.find(MapBooleanValues, o => (o.strict ? o.input === _.lowerCase(value) : o.input.includes(_.lowerCase(value))));
      return found ? found.output : null;
    case Predicates.COLUMN_DATA_TYPE_TEXT:
      return _.toString(value);
    default:
      return value;
  }
};

export function convertAttributeValues(predicate, columns) {
  const updPredicate = _.cloneDeep(predicate);

  function convert(current) {
    if (_.isArray(current)) {
      current.forEach(item => convert(item));
    } else if (_.isArray(current.val)) {
      current.val.forEach(item => {
        if (!_.isUndefined(item.val)) {
          convert(item);
        }
      });
      current.val = current.val.filter(v => !_.isNull(v.val));
    } else if (_.isObject(current)) {
      const col = columns && columns.find(item => item.attribute === current.att);
      const type = _.get(col, 'type');

      current.val = convertValueByType(type, current.val);

      if (current.val === '') {
        current.t = 'empty';
      }
    }
  }

  convert(updPredicate);

  return updPredicate;
}

/**
 * @deprecated
 * use {@link src/components/Journals/service/editors}
 */
export function getPredicateInput(field, sourceId, metaRecord, predicate = {}) {
  const defaultValue = {
    label: t('react-select.default-value.label'),
    value: null
  };

  const booleanOptions = [
    defaultValue,
    { label: t('react-select.value-true.label'), value: true },
    { label: t('react-select.value-false.label'), value: false }
  ];

  switch (field.type) {
    case COLUMN_DATA_TYPE_DATE:
    case COLUMN_DATA_TYPE_DATETIME:
      if (_.get(predicate, 't') === PREDICATE_TIME_INTERVAL || _.get(predicate, 'value') === PREDICATE_TIME_INTERVAL) {
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
              if (e.key === 'Enter' && typeof applyFilters === 'function') {
                applyFilters();
              }
            }
          })
        };
      }

      return {
        component: DatePicker,
        defaultValue: null, // new Date(),
        getProps: ({ predicateValue, changePredicateValue, datePickerWrapperClasses }) => ({
          className: 'ecos-input_narrow',
          wrapperClasses: datePickerWrapperClasses,
          showIcon: true,
          selected: predicateValue,
          onChange: function(value) {
            if (value && field.type === COLUMN_DATA_TYPE_DATE) {
              value = moment(value).format('YYYY-MM-DD');
            }

            if (value && field.type === COLUMN_DATA_TYPE_DATETIME) {
              value = moment(value).toISOString();
            }

            changePredicateValue(`${value}`);
          },
          showTimeInput: field.type === COLUMN_DATA_TYPE_DATETIME
        })
      };
    case COLUMN_DATA_TYPE_OPTIONS:
      const loadOptions = () => {
        const customOptions = _.get(field, 'params.edgeOptions');
        const serializeOptions = data => {
          if (!data) {
            return [defaultValue];
          }

          if (!isArray(data)) {
            data = [data];
          }

          return [
            defaultValue,
            ...data.map(item => {
              if (isObject(item)) {
                return { label: extractLabel(item.label || item.title), value: item.value };
              }

              return { label: extractLabel(String(item)), value: item };
            })
          ];
        };

        if (customOptions) {
          /* eslint-disable-next-line */
          const functionOptions = new Function('return ' + customOptions);
          const resultOptions = functionOptions() || [];

          if (resultOptions instanceof Promise) {
            return resultOptions.then(serializeOptions);
          } else {
            return Promise.resolve(serializeOptions(resultOptions));
          }
        }

        return new Promise(resolve => {
          Records.get(metaRecord || `${sourceId || ''}@`)
            .load(`#${field.attribute}?options`)
            .then(res => resolve(serializeOptions(res)));
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
          loadOptions,
          defaultValue,
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
        getProps: ({ predicateValue, changePredicateValue, selectClassName }) => ({
          className: `select_narrow ${selectClassName}`,
          isSearchable: false,
          defaultValue: defaultValue,
          options: booleanOptions,
          value: predicateValue,
          handleSetValue: (value, options) => options.filter(o => o.value === value)[0],
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
          journalId: _.get(field, 'params.journalTypeId') || field.editorKey,
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

    case COLUMN_DATA_TYPE_INT:
    case COLUMN_DATA_TYPE_DOUBLE:
    case COLUMN_DATA_TYPE_LONG:
    case COLUMN_DATA_TYPE_FLOAT:
      return {
        component: Input,
        defaultValue: '',
        getProps: ({ predicateValue, changePredicateValue, applyFilters }) => ({
          type: 'number',
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
    /* eslint-disable-next-line */
    case COLUMN_DATA_TYPE_MLTEXT:
    case COLUMN_DATA_TYPE_TEXT:
    case COLUMN_DATA_TYPE_CATEGORY:
    case COLUMN_DATA_TYPE_NODEREF:
    case COLUMN_DATA_TYPE_QNAME:
    default:
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
            if (e.key === 'Enter' && typeof applyFilters === 'function') {
              applyFilters();
            }
          }
        })
      };
  }
}
