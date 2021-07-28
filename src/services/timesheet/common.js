import get from 'lodash/get';

import { deepClone, t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import { isOnlyContent } from '../../helpers/timesheet/util';
import { URL } from '../../constants';
import { DelegationTypes, GroupedStatuses, ServerEventTypes, ServerStatusKeys, TimesheetTypes } from '../../constants/timesheet';

const Types = TimesheetTypes;
const Statuses = ServerStatusKeys;

export default class CommonTimesheetService {
  static getStatusFilters = (type, delegationType) => {
    let arrStatuses = [];

    switch (type) {
      case Types.SUBORDINATES:
        arrStatuses = [
          { key: Statuses.NOT_FILLED, label: CommonLabels.STATUSES_VAL_NOT_FILLED },
          { key: Statuses.MANAGER_APPROVAL, label: CommonLabels.STATUSES_VAL_WAITING_APPROVAL, isActive: true },
          { key: Statuses.CORRECTION, label: CommonLabels.STATUSES_VAL_SENT_FOR_REVISION },
          { key: GroupedStatuses.APPROVED, label: CommonLabels.STATUSES_VAL_AGREED, isGrouped: true }
        ];
        break;
      case Types.DELEGATED:
        if (delegationType === DelegationTypes.FILL) {
          arrStatuses = [
            { key: Statuses.NOT_FILLED, label: CommonLabels.STATUSES_VAL_NOT_FILLED, isActive: true },
            { key: Statuses.CORRECTION, label: CommonLabels.STATUSES_VAL_UNDER_REVISION },
            { key: Statuses.MANAGER_APPROVAL, label: CommonLabels.STATUSES_VAL_ON_AGREEMENT }
          ];
        } else if (delegationType === DelegationTypes.APPROVE) {
          arrStatuses = [
            { key: Statuses.NOT_FILLED, label: CommonLabels.STATUSES_VAL_NOT_FILLED },
            { key: Statuses.MANAGER_APPROVAL, label: CommonLabels.STATUSES_VAL_WAITING_APPROVAL, isActive: true },
            { key: Statuses.CORRECTION, label: CommonLabels.STATUSES_VAL_SENT_FOR_REVISION },
            { key: GroupedStatuses.APPROVED, label: CommonLabels.STATUSES_VAL_AGREED, isGrouped: true }
          ];
        }
        break;
      case Types.VERIFICATION:
        arrStatuses = [
          { key: Statuses.NOT_FILLED, label: CommonLabels.STATUSES_VAL_NOT_FILLED, isActive: true },
          { key: Statuses.MANAGER_APPROVAL, label: CommonLabels.STATUSES_VAL_ON_AGREEMENT_BY_MANAGER },
          { key: Statuses.APPROVED_BY_MANAGER, label: CommonLabels.STATUSES_VAL_AGREED_BY_MANAGER },
          { key: Statuses.CORRECTION, label: CommonLabels.STATUSES_VAL_SENT_FOR_REVISION },
          { key: Statuses.APPROVED_BY_HR, label: CommonLabels.STATUSES_VAL_AGREED, isGrouped: true },
          { key: Statuses.SENT_TO_ACCOUNTING_SYSTEM, label: CommonLabels.STATUSES_VAL_SENT_TO_ACCOUNTING_SYSTEM }
        ];
        break;
      default:
        break;
    }

    return arrStatuses.map(item => ({
      key: item.key,
      name: t(item.label),
      isGrouped: !!item.isGrouped,
      isActive: !!item.isActive,
      isAvailable: true
    }));
  };

  static getAllowedStatusKeys(type, delegationType) {
    const filters = CommonTimesheetService.getStatusFilters(type, delegationType);
    const flated = [];

    filters.forEach(item => {
      if (Array.isArray(item.key)) {
        Array.prototype.push.apply(flated, item.key);
      } else {
        flated.push(item.key);
      }
    });

    return flated;
  }

  static getSheetTabs = () => {
    const hasFrame = isOnlyContent();
    const pathname = get(window, ['location', 'pathname'], '');

    return [
      {
        key: TimesheetTypes.MINE,
        name: t(CommonLabels.MAIN_TAB_1),
        link: hasFrame ? URL.TIMESHEET_IFRAME : URL.TIMESHEET,
        isActive: [URL.TIMESHEET, URL.TIMESHEET_IFRAME].includes(pathname),
        isAvailable: true
      },
      {
        key: TimesheetTypes.SUBORDINATES,
        name: t(CommonLabels.MAIN_TAB_2),
        link: hasFrame ? URL.TIMESHEET_IFRAME_SUBORDINATES : URL.TIMESHEET_SUBORDINATES,
        isActive: [URL.TIMESHEET_SUBORDINATES, URL.TIMESHEET_IFRAME_SUBORDINATES].includes(pathname),
        isAvailable: true
      },
      {
        key: TimesheetTypes.DELEGATED,
        name: t(CommonLabels.MAIN_TAB_3),
        link: hasFrame ? URL.TIMESHEET_IFRAME_DELEGATED : URL.TIMESHEET_DELEGATED,
        isActive: [URL.TIMESHEET_IFRAME_DELEGATED, URL.TIMESHEET_DELEGATED].includes(pathname),
        isAvailable: true,
        badge: null
      }
    ];
  };

  static getPeriodFiltersTabs = () => {
    return [
      {
        name: t(CommonLabels.MONTH),
        isActive: true,
        isAvailable: true
      },
      {
        name: t(CommonLabels.YEAR),
        isActive: false,
        isAvailable: false
      }
    ];
  };

  static get eventTypes() {
    return CommonTimesheetService.getEventTypes();
  }

  static getEventTypes = () => {
    return [
      {
        title: t(CommonLabels.EVENT_TYPE_DAYTIME_WORK),
        name: ServerEventTypes.DAYTIME_WORK,
        color: '#00C308',
        hours: {
          editable: true,
          hidden: false
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_BUSINESS_TRIP),
        name: ServerEventTypes.BUSINESS_TRIP,
        color: '#ff3ecb',
        hours: {
          editable: true,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_ABSENCE),
        name: ServerEventTypes.ABSENCE,
        color: '#af9fff',
        hours: {
          editable: true,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_ANNUAL_PAID_LEAVE),
        name: ServerEventTypes.ANNUAL_BASIC_PAID_LEAVE,
        color: '#DF3386',
        hours: {
          editable: false,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_UNPAID_LEAVE),
        name: ServerEventTypes.BASIC_UNPAID_LEAVE,
        color: '#ff41e3',
        hours: {
          editable: false,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_LEAVE_1_OF_5),
        name: ServerEventTypes.ONE_OF_FIVE,
        color: '#d51842',
        hours: {
          editable: false,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_NORTH_PAID_LEAVE),
        name: ServerEventTypes.NORTH_PAID_LEAVE,
        color: '#e89972',
        hours: {
          editable: false,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_HARMFUL_PAID_LEAVE),
        name: ServerEventTypes.HARMFUL_PAID_LEAVE,
        color: '#c0ac70',
        hours: {
          editable: false,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_IRREGULAR_PAID_LEAVE),
        name: ServerEventTypes.IRREGULAR_PAID_LEAVE,
        color: '#ff9953',
        hours: {
          editable: false,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_COMPENSATORY_LEAVE),
        name: ServerEventTypes.COMPENSATORY_LEAVE,
        color: '#29bd8d',
        hours: {
          editable: true,
          hidden: true,
          eq: 8
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_WORK_ON_DAY_OFF_1),
        name: ServerEventTypes.WEEKENDS_HOLIDAYS_WORK_HOLIDAY_AND_COMPENSATION,
        color: '#33DFD5',
        hours: {
          editable: true,
          hidden: false
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_WORK_ON_DAY_OFF_2),
        name: ServerEventTypes.WEEKENDS_HOLIDAYS_WORK_DOUBLED_COMPENSATION,
        color: '#3382df',
        hours: {
          editable: true,
          hidden: false
        }
      },
      {
        title: t(CommonLabels.EVENT_TYPE_OVERTIME_WORK),
        name: ServerEventTypes.OVERTIME_WORK,
        color: '#DF8633',
        hours: {
          editable: true,
          hidden: false
        }
      }
      /* {
        title: t(CommonLabels.EVENT_TYPE_NIGHT_WORK),
        name: ServerEventTypes.NIGHT_WORK,
        color: '#4133DF',
        hours: {
          editable: true,
          hidden: true,
          max: 8
        },
      }*/
    ];
  };

  static getKeyHours(data) {
    const { userName = 'mine', number, eventType } = data;

    return `${userName}-${number}-${eventType}`;
  }

  static setUpdatingHours(map, data, reset) {
    data = deepClone(data);
    map = deepClone(map);

    const { value, hasError = false } = data;

    const key = CommonTimesheetService.getKeyHours(data);

    if (reset) {
      delete map[key];
    } else {
      map[key] = { value, hasError };
    }

    return map;
  }

  static getColumnsEventHistory() {
    return [
      {
        attribute: 'event:date',
        formatter: {
          name: 'DateTimeFormatter',
          params: {
            format: 'DD.MM.YYYY HH:mm:ss'
          }
        },
        text: t(CommonLabels.EVENT_HISTORY_COL_DATE),
        type: 'date'
      },
      {
        dataField: 'event:initiator',
        formatter: 'UserNameLinkFormatter',
        text: t(CommonLabels.EVENT_HISTORY_COL_PERSON)
      },
      {
        attribute: 'event:taskTitle',
        text: t(CommonLabels.EVENT_HISTORY_COL_TASK)
      },
      {
        attribute: 'event:taskOutcomeTitle',
        text: t(CommonLabels.EVENT_HISTORY_COL_OUTCOME)
      },
      {
        attribute: 'event:taskComment',
        text: t(CommonLabels.EVENT_HISTORY_COL_COMMENT),
        width: 230
      }
    ];
  }

  static getUserNameList(array) {
    const target = [];

    if (Array.isArray(array)) {
      array.forEach(item => {
        target.push(item.userName);
      });
    }

    return target;
  }

  static getTotalCounts(others, current) {
    const target = { ...others, ...current };
    const keys = Object.getOwnPropertyNames(target);

    target.all = keys.reduce((accumulator, key) => accumulator + target[key], 0);

    return target;
  }

  static deleteRecordLocalByUserName(mergedList, userName) {
    let updatedML = deepClone(mergedList);

    return updatedML.filter(item => item.userName !== userName);
  }
}
