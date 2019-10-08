import get from 'lodash/get';
import { deepClone } from '../../helpers/util';
import moment from 'moment';
import CommonTimesheetService from '../../services/timesheet/common';

const eventTypes = CommonTimesheetService.getEventTypes();

export default class MyTimesheetConverter {
  static getStatusForWeb(source = []) {
    const st = get(source, 'records[0]', {});
    const target = {};

    target.key = st.status;
    target.taskId = st.taskId;
    target.comment = ''; //todo ?

    return target;
  }

  static getMergedEventsListForWeb(source = []) {
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
