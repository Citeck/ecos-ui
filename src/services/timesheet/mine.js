import { StatusesServerKeys, StatusesServerOutcomeKeys } from '../../helpers/timesheet/constants';

export default class MyTimesheetService {
  static getMyStatusOutcomeByCurrent(currentStatus) {
    switch (currentStatus) {
      case StatusesServerKeys.NOT_FILLED:
      case StatusesServerKeys.CORRECTION:
        return StatusesServerOutcomeKeys.TASK_DONE;
      default:
        return null;
    }
  }
}
