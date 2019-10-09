import {
  CommonLabels,
  GroupedStatuses,
  ServerEventTypes,
  StatusActions,
  StatusesServerKeys,
  TimesheetTypes
} from '../../helpers/timesheet/constants';
import { t } from '../../helpers/util';
import { URL } from '../../constants';

const Types = TimesheetTypes;
const Statuses = StatusesServerKeys;

export default class CommonTimesheetService {
  static getStatusFilters = (type, action) => {
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
        if (action === StatusActions.FILL) {
          arrStatuses = [
            { key: Statuses.NOT_FILLED, label: CommonLabels.STATUSES_VAL_NOT_FILLED, isActive: true },
            { key: Statuses.CORRECTION, label: CommonLabels.STATUSES_VAL_UNDER_REVISION },
            { key: Statuses.MANAGER_APPROVAL, label: CommonLabels.STATUSES_VAL_ON_AGREEMENT }
          ];
        } else if (action === StatusActions.APPROVE) {
          arrStatuses = [
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
          { key: GroupedStatuses.APPROVED, label: CommonLabels.STATUSES_VAL_AGREED, isGrouped: true }
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

  static getSheetTabs = (isOnlyContent, location) => {
    return [
      {
        key: TimesheetTypes.MINE,
        name: t(CommonLabels.MAIN_TAB_1),
        link: isOnlyContent ? URL.TIMESHEET_IFRAME : URL.TIMESHEET,
        isActive: [URL.TIMESHEET, URL.TIMESHEET_IFRAME].includes(location.pathname),
        isAvailable: true
      },
      {
        key: TimesheetTypes.SUBORDINATES,
        name: t(CommonLabels.MAIN_TAB_2),
        link: isOnlyContent ? URL.TIMESHEET_IFRAME_SUBORDINATES : URL.TIMESHEET_SUBORDINATES,
        isActive: [URL.TIMESHEET_SUBORDINATES, URL.TIMESHEET_IFRAME_SUBORDINATES].includes(location.pathname),
        isAvailable: true
      },
      {
        key: TimesheetTypes.DELEGATED,
        name: t(CommonLabels.MAIN_TAB_3),
        link: isOnlyContent ? URL.TIMESHEET_IFRAME_DELEGATED : URL.TIMESHEET_DELEGATED,
        isActive: [URL.TIMESHEET_IFRAME_DELEGATED, URL.TIMESHEET_DELEGATED].includes(location.pathname),
        isAvailable: true,
        badge: '99'
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

  static getEventTypes = () => {
    return [
      {
        title: t(CommonLabels.EVENT_TYPE_DAYTIME_WORK),
        name: ServerEventTypes.DAYTIME_WORK,
        color: '#00C308',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_BUSINESS_TRIP),
        name: ServerEventTypes.BUSINESS_TRIP,
        color: '#ff3ecb',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_ABSENCE),
        name: ServerEventTypes.ABSENCE,
        color: '#af9fff',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_ANNUAL_PAID_LEAVE),
        name: ServerEventTypes.ANNUAL_BASIC_PAID_LEAVE,
        color: '#DF3386',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_UNPAID_LEAVE),
        name: ServerEventTypes.BASIC_UNPAID_LEAVE,
        color: '#ff41e3',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_LEAVE_1_OF_5),
        name: ServerEventTypes.ONE_OF_FIVE,
        color: '#d51842',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_NORTH_PAID_LEAVE),
        name: ServerEventTypes.NORTH_PAID_LEAVE,
        color: '#e89972',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_HARMFUL_PAID_LEAVE),
        name: ServerEventTypes.HARMFUL_PAID_LEAVE,
        color: '#c0ac70',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_IRREGULAR_PAID_LEAVE),
        name: ServerEventTypes.IRREGULAR_PAID_LEAVE,
        color: '#ff9953',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_COMPENSATORY_LEAVE),
        name: ServerEventTypes.COMPENSATORY_LEAVE,
        color: '#29bd8d',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_WORK_ON_DAY_OFF_1),
        name: ServerEventTypes.WEEKENDS_HOLIDAYS_WORK_HOLIDAY_AND_COMPENSATION,
        color: '#33DFD5',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_WORK_ON_DAY_OFF_2),
        name: ServerEventTypes.WEEKENDS_HOLIDAYS_WORK_DOUBLED_COMPENSATION,
        color: '#3382df',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_OVERTIME_WORK),
        name: ServerEventTypes.OVERTIME_WORK,
        color: '#DF8633',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_NIGHT_WORK),
        name: ServerEventTypes.NIGHT_WORK,
        color: '#4133DF',
        canEdit: true
      }
    ];
  };
}
