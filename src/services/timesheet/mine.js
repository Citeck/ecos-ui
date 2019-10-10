import { ServerStatusKeys, ServerStatusOutcomeKeys } from '../../helpers/timesheet/constants';

export default class MyTimesheetService {
  static getMyStatusOutcomeByCurrent(currentStatus) {
    switch (currentStatus) {
      case ServerStatusKeys.NOT_FILLED:
      case ServerStatusKeys.CORRECTION:
        return ServerStatusOutcomeKeys.TASK_DONE;
      default:
        return null;
    }
  }
}
