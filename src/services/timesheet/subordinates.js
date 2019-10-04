import { deepClone } from '../../helpers/util';

export default class SubordinatesTimesheetService {
  static mergeToSubordinatesEventsList({ subordinates, events }) {
    const target = [];

    if (Array.isArray(subordinates) && Array.isArray(events)) {
      events.forEach(item => {
        const newItem = deepClone(item);
        const user = subordinates.find(men => item.peopleId === men.id) || {};

        newItem.user = user;
        target.push(newItem);
      });
    }

    return target;
  }
}
