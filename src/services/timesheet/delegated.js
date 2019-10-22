import { t } from '../../helpers/util';
import { CommonLabels, StatusActionFilters } from '../../helpers/timesheet/constants';

export default class DelegatedTimesheetService {
  static mergeManyToOneList({ peopleList = [], calendarEvents = [], requestList = [] }) {
    const target = [];

    if (Array.isArray(peopleList)) {
      peopleList.forEach(item => {
        const newItem = {};

        newItem.user = item;
        newItem.calendarEvents = calendarEvents[item.userName] || {};
        newItem.status = Array.isArray(requestList) ? requestList.find(us => item.userName === us.userName) || {} : {};

        target.push(newItem);
      });
    }

    return target;
  }

  static getDelegatedActions() {
    return [
      {
        name: t(CommonLabels.STATUS_ACTION_FILL_IN),
        isActive: true,
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
