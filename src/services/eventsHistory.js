import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';

import { COLUMN_TYPE_NEW_TO_LEGACY_MAPPING } from '../components/Journals/service/util';
import {
  datePredicateVariables,
  PREDICATE_CONTAINS,
  PREDICATE_EMPTY,
  PREDICATE_ENDS,
  PREDICATE_EQ,
  PREDICATE_GE,
  PREDICATE_GT,
  PREDICATE_LE,
  PREDICATE_LT,
  PREDICATE_NOT_CONTAINS,
  PREDICATE_NOT_EMPTY,
  PREDICATE_NOT_EQ,
  PREDICATE_STARTS
} from '../components/Records/predicates/predicates';
import OrgstructEditor from '../components/Journals/service/editors/registry/OrgstructEditor';
import { AUTHORITY_TYPE_USER } from '../components/common/form/SelectOrgstruct/constants';
import DateTimeEditor from '../components/Journals/service/editors/registry/DateTimeEditor';
import { cellMsg, t } from '../helpers/util';
import { DataFormatTypes, DateFormats } from '../constants';

export default class EventsHistoryService {
  static defaultJournal = 'history-records-widget';

  /**
   * @deprecated Use journal config
   */
  static config = {
    columns: [
      {
        attribute: 'event:date',
        formatter: {
          name: 'DateTimeFormatter',
          params: {
            format: 'DD.MM.YYYY HH:mm:ss'
          }
        },
        text: t('dochist.header.date'),
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.DATETIME,
        newEditor: {
          config: {},
          type: DateTimeEditor.TYPE
        }
      },
      {
        attribute: 'event:name',
        formatter: {
          name: 'FunctionFormatter',
          params: {
            fn: cellMsg('dochist.')
          }
        },
        text: t('dochist.header.name'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:documentVersion',
        text: t('dochist.header.version'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        dataField: 'event:initiator',
        formatter: 'UserNameLinkFormatter',
        text: t('dochist.header.person'),
        newEditor: {
          config: {
            allowedAuthorityTypes: AUTHORITY_TYPE_USER
          },
          type: OrgstructEditor.TYPE
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.AUTHORITY
      },
      {
        attribute: 'taskOriginalOwner',
        formatter: 'UserNameLinkFormatter',
        text: t('dochist.header.fromName'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:taskRole',
        text: t('dochist.header.group'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:taskTitle',
        text: t('dochist.header.task'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:taskOutcomeTitle',
        text: t('dochist.header.outcome'),
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      },
      {
        attribute: 'event:taskComment',
        text: t('dochist.header.comment'),
        className: 'event-cell-task-comment',
        newEditor: {
          config: {},
          type: 'text'
        },
        type: COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.TEXT
      }
    ]
  };

  /**
   * @deprecated
   */
  static getDateCompareResult(filter, value, format) {
    const valueInMoment = moment(value);
    const filterInMoment = moment(filter.val);

    switch (filter.t) {
      case PREDICATE_GT:
        return valueInMoment.isAfter(filterInMoment);
      case PREDICATE_GE:
        return valueInMoment.isSameOrAfter(filterInMoment);
      case PREDICATE_LT:
        return valueInMoment.isBefore(filterInMoment);
      case PREDICATE_LE:
        return valueInMoment.isSameOrBefore(filterInMoment);
      case PREDICATE_NOT_EQ:
        return filterInMoment.format(format) !== valueInMoment.format(format);
      case PREDICATE_EQ:
        return filterInMoment.format(format) === valueInMoment.format(format);
      case PREDICATE_EMPTY:
        return isEmpty(value);
      case PREDICATE_NOT_EMPTY:
        return !isEmpty(value);
      case PREDICATE_CONTAINS:
      default: {
        if (filter.val === datePredicateVariables.TODAY) {
          return valueInMoment.format(DateFormats.DATE) === moment().format(DateFormats.DATE);
        }

        return true;
      }
    }
  }

  /**
   * @deprecated
   */
  static getCompareResult(filter, value) {
    if (Array.isArray(filter.val)) {
      return filter.val.some(item => EventsHistoryService.getCompareResult({ t: filter.t, val: item }, value));
    }

    switch (filter.t) {
      case PREDICATE_EMPTY:
        return isEmpty(value);
      case PREDICATE_NOT_EMPTY:
        return !isEmpty(value);
      case PREDICATE_ENDS:
        return value.endsWith(filter.val);
      case PREDICATE_STARTS:
        return value.startsWith(filter.val);
      case PREDICATE_EQ:
        return isEqual(value, filter.val);
      case PREDICATE_NOT_EQ:
        return !isEqual(value, filter.val);
      case PREDICATE_CONTAINS:
        return value.toLowerCase().includes((filter.val || '').toLowerCase());
      case PREDICATE_NOT_CONTAINS:
        return !value.toLowerCase().includes((filter.val || '').toLowerCase());
      default:
        return true;
    }
  }

  static isDate = value => [DataFormatTypes.DATETIME, DataFormatTypes.DATE].includes(value);

  /**
   * @deprecated
   * https://citeck.atlassian.net/browse/ECOSUI-1749
   */
  static filterGridData({ list, columns, filters }) {
    return list.filter((item, index) =>
      filters.every(filter => {
        const column = columns.find(column => column.attribute === filter.att || column.dataField === filter.att);
        const formatter = get(column, 'formatExtraData.formatter');
        const format = column.type === DataFormatTypes.DATE ? DateFormats.DATE : DateFormats.DATETIME;

        if (formatter && formatter.getFilterValue) {
          const value =
            formatter.getFilterValue(
              item[filter.att],
              item,
              get(column, 'formatExtraData.params'),
              index,
              column.type === COLUMN_TYPE_NEW_TO_LEGACY_MAPPING.AUTHORITY ? 'nodeRef' : ''
            ) || '';

          if (!EventsHistoryService.isDate(column.type)) {
            return EventsHistoryService.getCompareResult(filter, value);
          }

          return EventsHistoryService.getDateCompareResult(filter, value, format);
        }

        if (!EventsHistoryService.isDate(column.type)) {
          return EventsHistoryService.getCompareResult(filter, item[filter.att]);
        }

        return EventsHistoryService.getDateCompareResult(filter, item[filter.att]);
      })
    );
  }

  /**
   * @deprecated
   * https://citeck.atlassian.net/browse/ECOSUI-1749
   */
  static applyFilters(items, newItem) {
    const filtering = item => {
      if (isEqual(item, newItem)) {
        return false;
      }

      return item.att !== newItem.att;
    };

    const result = items.filter(filtering);

    if (!isEmpty(newItem.val) || !newItem.needValue) {
      result.push(newItem);
    }

    return result;
  }
}
