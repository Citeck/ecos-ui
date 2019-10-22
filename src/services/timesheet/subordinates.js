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

  static setUserStatusInLists({ mergedList, statuses, userName, status }) {
    const updatedML = deepClone(mergedList);
    const updatedSL = deepClone(statuses);

    updatedML.forEach(item => {
      if (item.userName === userName) {
        item.status = status;
      }
    });
    updatedSL.forEach(item => {
      if (item.userName === userName) {
        item.status = status;
      }
    });

    return { mergedList: updatedML, statuses: updatedSL };
  }
}
