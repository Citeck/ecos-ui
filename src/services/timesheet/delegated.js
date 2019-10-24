import { t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import { StatusActionFilters } from '../../constants/timesheet';

export default class DelegatedTimesheetService {
  static mergeManyToOneList({ peopleList = [], calendarEvents = [], requestList = [] }) {
    const target = [];

    if (Array.isArray(requestList)) {
      requestList.forEach(item => {
        const newItem = { ...item };

        newItem.user = Array.isArray(peopleList) ? peopleList.find(us => item.userName === us.userName) || {} : {};
        newItem.calendarEvents = calendarEvents[item.userName] || {};

        target.push(newItem);
      });
    }

    return target;
  }

  static getDelegatedActions() {
    return [
      {
        name: t(CommonLabels.STATUS_ACTION_FILL_IN),
        isActive: false,
        isAvailable: true,
        badge: 0,
        action: StatusActionFilters.FILL
      },
      {
        name: t(CommonLabels.STATUS_ACTION_TO_APPROVE),
        isActive: false,
        isAvailable: true,
        badge: 0,
        action: StatusActionFilters.APPROVE
      }
    ];
  }
}
