export default class VerificationTimesheetService {
  static mergeToVerificationEventsList({ peopleList, calendarEvents, requestList = [] }) {
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

  static getUserNameList(array) {
    const target = [];

    if (Array.isArray(array)) {
      array.forEach(item => {
        target.push(item.userName);
      });
    }

    return target;
  }
}
