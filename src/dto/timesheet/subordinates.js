import get from 'lodash/get';
import CommonTimesheetConverter from './common';

export default class SubordinatesTimesheetConverter {
  static getSubordinatesEventsListForWeb(source = []) {
    const target = [];

    source.forEach(item => {
      const newItem = {};

      newItem.user = [get(item, 'user.lastName', ''), get(item, 'user.firstName', ''), get(item, 'user.middleName', '')].join(' ');
      newItem.userName = get(item, 'user.userName', '');
      newItem.timesheetNumber = get(item, 'user.userName', '');
      newItem.status = get(item, 'status.status', '');
      newItem.taskId = get(item, 'status.taskId', '');
      newItem.nodeRef = get(item, 'status.nodeRef', '');
      newItem.eventTypes = CommonTimesheetConverter.getCalendarEventsForWeb(item.calendarEvents);

      target.push(newItem);
    });

    return target;
  }
}
