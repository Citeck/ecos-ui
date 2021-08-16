import cloneDeep from 'lodash/cloneDeep';

export default class VerificationTimesheetService {
  static mergeManyToOneList({ peopleList, calendarEvents, requestList = [] }) {
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

  static mergeList({ currentList = [], newItem, eventTypes }) {
    const target = cloneDeep(currentList);
    const merge = newItem => {
      const index = target.findIndex(item => item.userName === newItem.userName);
      const data = cloneDeep({
        ...newItem,
        eventTypes
      });

      if (index !== -1) {
        target[index] = data;
      } else {
        target.push(data);
      }
    };

    if (Array.isArray(newItem)) {
      newItem.forEach(merge);
    } else {
      merge(newItem);
    }

    return target;
  }
}
