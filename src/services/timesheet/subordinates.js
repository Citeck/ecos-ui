export default class SubordinatesTimesheetService {
  static mergeToSubordinatesEventsList({ subordinates, calendarEvents, statuses }) {
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
