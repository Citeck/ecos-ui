import get from 'lodash/get';
import CommonTimesheetConverter from './common';

export default class SubordinatesTimesheetConverter {
  static getSubordinatesEventsListForWeb(source = []) {
    const target = [];

    source.forEach(item => {
      const newItem = {};

      newItem.user = [get(item, 'user.lastName', ''), get(item, 'user.firstName', ''), get(item, 'user.middleName', '')].join(' ');
      newItem.userName = get(item, 'user.userName', '');
      newItem.timesheetNumber = get(item, 'userName', '');
      newItem.status = get(item, 'status', '');
      newItem.taskId = get(item, 'taskId', '');
      newItem.nodeRef = `workspace://SpacesStore/${item.uid}`;
      newItem.eventTypes = CommonTimesheetConverter.getCalendarEventsForWeb(item.calendarEvents);

      target.push(newItem);
    });

    return target;
  }
}
