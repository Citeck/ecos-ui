export default class VerificationTimesheetService {
  static mergeToVerificationEventsList({ infoPeopleList, calendarEvents, userNameStatuses }) {
    const target = [];

    if (Array.isArray(infoPeopleList)) {
      infoPeopleList.forEach(item => {
        const newItem = {};

        newItem.user = item;
        newItem.calendarEvents = calendarEvents[item.userName] || {};
        newItem.status = userNameStatuses.find(us => item.userName === us.userName) || {};

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
