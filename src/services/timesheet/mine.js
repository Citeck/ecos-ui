import { ServerStatusKeys, ServerStatusOutcomeKeys } from '../../constants/timesheet';

export default class MyTimesheetService {
  static getMyStatusOutcomeByCurrent(currentStatus) {
    switch (currentStatus) {
      case ServerStatusKeys.NOT_FILLED:
      case ServerStatusKeys.CORRECTION:
        return ServerStatusOutcomeKeys.TASK_DONE;
      case ServerStatusKeys.MANAGER_APPROVAL:
      case ServerStatusKeys.APPROVED_BY_MANAGER:
        return ServerStatusOutcomeKeys.SEND_BACK;
      default:
        return null;
    }
  }
}
