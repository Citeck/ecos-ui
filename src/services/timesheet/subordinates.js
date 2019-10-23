import { deepClone } from '../../helpers/util';

export default class SubordinatesTimesheetService {
  static mergeManyToOneList({ subordinates, calendarEvents, statuses }) {
    const target = [];

    if (Array.isArray(subordinates)) {
      subordinates.forEach(item => {
        const newItem = {};

        newItem.user = item;
        newItem.calendarEvents = calendarEvents[item.userName] || {};
        newItem.status = statuses.find(status => item.userName === status.userName) || {};

        target.push(newItem);
      });
    }

    return target;
  }

  static deleteRecordLocalByUserName(mergedList, userName) {
    let updatedML = deepClone(mergedList);

    return updatedML.filter(item => item.userName !== userName);
  }
}
