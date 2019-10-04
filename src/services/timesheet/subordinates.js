import { deepClone } from '../../helpers/util';

export default class SubordinatesTimesheetService {
  static mergeToSubordinatesEventsList({ subordinates, events, statuses }) {
    const target = [];

    if (Array.isArray(subordinates) && Array.isArray(events)) {
      events.forEach(item => {
        const newItem = deepClone(item);
        const user = subordinates.find(men => item.peopleId === men.id) || {};
        const status = statuses.find(status => user.userName === status.userName) || {};

        newItem.user = user;
        newItem.status = status;

        target.push(newItem);
      });
    }

    return target;
  }

  static getUserNameList(subordinates) {
    const target = [];

    if (Array.isArray(subordinates)) {
      subordinates.forEach(item => {
        target.push(item.userName);
      });
    }

    return target;
  }
}
