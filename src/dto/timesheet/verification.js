import get from 'lodash/get';
import CommonTimesheetConverter from './common';
import { TimesheetTypes } from '../../constants/timesheet';

export default class VerificationTimesheetConverter {
  static getVerificationEventsListForWeb(source = []) {
    const target = [];

    source.forEach(item => {
      const newItem = {};

      newItem.user = [get(item, 'user.lastName', ''), get(item, 'user.firstName', ''), get(item, 'user.middleName', '')].join(' ');
      newItem.userName = get(item, 'userName', '');
      newItem.timesheetNumber = get(item, 'userName', '');
      newItem.status = get(item, 'status', '');
      newItem.taskId = get(item, 'taskId', '');
      newItem.eventTypes = CommonTimesheetConverter.getCalendarEventsForWeb(item.calendarEvents, TimesheetTypes.VERIFICATION);
      newItem.nodeRef = `workspace://SpacesStore/${item.uid}`;

      target.push(newItem);
    });

    return target;
  }

  static getCalendarEventsForWeb(source = []) {
    return CommonTimesheetConverter.getCalendarEventsForWeb(source, TimesheetTypes.VERIFICATION);
  }

  static getUsersForWeb(data) {
    const source = get(data, 'records', []);
    const target = [];

    source.forEach(item => {
      const newItem = {};

      newItem.user = get(item, 'fullName', '');
      newItem.userName = get(item, 'userName', '');
      newItem.timesheetNumber = get(item, 'userName', '');
      newItem.status = get(item, 'status', '');
      newItem.taskId = get(item, 'taskId', '');
      newItem.nodeRef = `workspace://SpacesStore/${item.uid}`;

      target.push(newItem);
    });

    return target;
  }
}
