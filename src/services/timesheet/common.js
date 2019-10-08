import {
  CommonLabels,
  GroupedStatuses,
  StatusActions,
  StatusesServerKeys,
  StatusesServerOutcomeKeys,
  TimesheetTypes
} from '../../helpers/timesheet/constants';
import { t } from '../../helpers/util';

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

  static getOutcomeStatusByCurrent(currentStatus) {
    switch (currentStatus) {
      case StatusesServerKeys.NOT_FILLED:
        return StatusesServerOutcomeKeys.TASK_DONE;
      case StatusesServerKeys.MANAGER_APPROVAL:
      case StatusesServerKeys.APPROVED_BY_MANAGER:
        return StatusesServerKeys.NOT_FILLED;
      case StatusesServerKeys.CORRECTION:
        return StatusesServerOutcomeKeys.TASK_DONE;
      default:
        return null;
    }
  }

  static getEventTypes = () => {
    return [
      {
        title: t(CommonLabels.EVENT_TYPE_DAYTIME_WORK),
        name: 'daytime-work',
        color: '#00C308',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_BUSINESS_TRIP),
        name: 'business-trip',
        color: '#ff3ecb',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_ABSENCE),
        name: 'absence',
        color: '#af9fff',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_ANNUAL_PAID_LEAVE),
        name: 'annual-basic-paid-leave',
        color: '#DF3386',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_UNPAID_LEAVE),
        name: 'basic-unpaid-leave',
        color: '#ff41e3',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_LEAVE_1_OF_5),
        name: 'one-of-five',
        color: '#d51842',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_NORTH_PAID_LEAVE),
        name: 'north-paid-leave',
        color: '#e89972',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_HARMFUL_PAID_LEAVE),
        name: 'harmful-paid-leave',
        color: '#c0ac70',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_IRREGULAR_PAID_LEAVE),
        name: 'irregular-paid-leave',
        color: '#ff9953',
        canEdit: false
      },
      {
        title: t(CommonLabels.EVENT_TYPE_COMPENSATORY_LEAVE),
        name: 'compensatory-leave',
        color: '#29bd8d',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_WORK_ON_DAY_OFF_1),
        name: 'weekends-holidays-work-holiday-and-compensation',
        color: '#33DFD5',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_WORK_ON_DAY_OFF_2),
        name: 'weekends-holidays-work-doubled-compensation',
        color: '#3382df',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_OVERTIME_WORK),
        name: 'overtime-work',
        color: '#DF8633',
        canEdit: true
      },
      {
        title: t(CommonLabels.EVENT_TYPE_NIGHT_WORK),
        name: 'night-work',
        color: '#4133DF',
        canEdit: true
      }
    ];
  };
}
