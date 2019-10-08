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
}
