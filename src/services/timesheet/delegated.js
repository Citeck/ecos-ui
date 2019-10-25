import { t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import { DelegationTypes } from '../../constants/timesheet';

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

  static getDelegationType() {
    return [
      {
        name: t(CommonLabels.DELEGATION_TYPE_FILL_IN),
        isActive: false,
        isAvailable: true,
        badge: 0,
        type: DelegationTypes.FILL
      },
      {
        name: t(CommonLabels.DELEGATION_TYPE_TO_APPROVE),
        isActive: false,
        isAvailable: true,
        badge: 0,
        type: DelegationTypes.APPROVE
      }
    ];
  }
}
