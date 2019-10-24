export default class SubordinatesTimesheetService {
  static mergeManyToOneList({ peopleList, calendarEvents, requestList }) {
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
}
