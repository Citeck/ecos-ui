import get from 'lodash/get';
import moment from 'moment';
import { deepClone } from '../../helpers/util';
import CommonTimesheetService from '../../services/timesheet/common';

const eventTypes = CommonTimesheetService.getEventTypes();

export default class SubordinatesTimesheetConverter {
  static getSubordinatesEventsListForWeb(source = []) {
    const target = [];

    source.forEach(item => {
      const newItem = {};

      newItem.user = [get(item, 'user.lastName', ''), get(item, 'user.firstName', ''), get(item, 'user.middleName', '')].join(' ');
      newItem.timesheetNumber = get(item, 'user.userName', '');
      newItem.status = get(item, 'status.status', '');
      newItem.taskId = get(item, 'status.taskId', '');
      newItem.eventTypes = SubordinatesTimesheetConverter.getCalendarEventsForWeb(item.calendarEvents);

      target.push(newItem);
    });

    return target;
  }

  static getCalendarEventsForWeb(source = []) {
    const target = deepClone(eventTypes);

    if (Array.isArray(source)) {
      source.forEach(day => {
        const index = target.findIndex(type => type.name === day.eventType);
        const eventType = target[index];

        if (eventType) {
          if (!Array.isArray(eventType.days)) {
            eventType.days = [];
          }

          eventType.days.push({
            date: day.date,
            number: moment(day.date, 'DD.MM.YYYY').format('D'),
            hours: day.hoursCount || 0
          });

          target[index] = eventType;
        }
      });
    }

    return target;
  }
}
