import { ServerDateFormats, TimesheetTypes } from '@citeck/constants/timesheet';
import get from 'lodash/get';
import set from 'lodash/set';
import moment from 'moment';

import { deepClone } from '../../helpers/util';
import CommonTimesheetService from '../../services/timesheet/common';

export default class CommonTimesheetConverter {
  static getStatusForWeb(source = []) {
    const st = get(source, 'records[0]', {});
    const target = {};

    target.key = st.status;
    target.taskId = st.taskId;
    target.comment = '';
    target.recordRef = st.nodeRef;

    return target;
  }

  static setParamsEventTypes({ eventTypes, timesheetType }) {
    const target = deepClone(eventTypes);

    target.forEach(item => {
      if (!Array.isArray(item.days)) {
        item.days = [];
      }

      if (timesheetType && timesheetType === TimesheetTypes.VERIFICATION) {
        set(item, 'hours.editable', true);
      }
    });

    return target;
  }

  static getCalendarEventsForWeb(source = [], timesheetType = '') {
    const eventTypes = CommonTimesheetService.getEventTypes();
    const target = CommonTimesheetConverter.setParamsEventTypes({ eventTypes, timesheetType });

    if (Array.isArray(source)) {
      source.forEach(day => {
        const index = target.findIndex(type => type.name === day.eventType);
        const eventType = target[index];

        if (eventType) {
          if (!Array.isArray(eventType.days)) {
            eventType.days = [];
          }

          eventType.days.push({
            number: moment(day.date, ServerDateFormats.DDMMYYYY).format('D'),
            hours: day.hoursCount || 0
          });

          target[index] = eventType;
        }
      });
    }

    return target;
  }
}
