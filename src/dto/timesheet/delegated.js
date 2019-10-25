import get from 'lodash/get';
import CommonTimesheetConverter from './common';

export default class DelegatedTimesheetConverter {
  static getDelegatedEventsListForWeb(source = []) {
    const target = [];

    source.forEach(item => {
      const newItem = {};

      newItem.user = [get(item, 'user.lastName', ''), get(item, 'user.firstName', ''), get(item, 'user.middleName', '')].join(' ');
      newItem.userName = get(item, 'userName', '');
      newItem.timesheetNumber = get(item, 'userName', '');
      newItem.status = get(item, 'status', '');
      newItem.taskId = get(item, 'taskId', '');
      newItem.eventTypes = CommonTimesheetConverter.getCalendarEventsForWeb(item.calendarEvents);
      newItem.nodeRef = `workspace://SpacesStore/${item.uid}`;

      target.push(newItem);
    });

    return target;
  }

  static getDeputyListForWeb(source = []) {
    const target = [];

    source &&
      source.forEach(item => {
        const newItem = {};

        newItem.userFullName = [get(item, 'userFullName', ''), get(item, 'firstName', ''), get(item, 'middleName', '')].join(' ');
        newItem.userName = get(item, 'userName', '');

        target.push(newItem);
      });

    return target;
  }
}
