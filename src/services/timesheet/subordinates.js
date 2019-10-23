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
}
