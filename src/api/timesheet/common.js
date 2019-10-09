import { RecordService } from '../recordService';
import Records from '../../components/Records';

export class TimesheetCommonApi extends RecordService {
  getTimesheetStatusList = ({ month, year, userNames }) => {
    return Records.query(
      {
        query: { month, year, userNames },
        language: 'json',
        maxItems: 100,
        sourceId: 'timesheet-status',
        debug: false
      },
      {
        userName: 'username',
        status: 'status',
        taskId: 'taskId'
      }
    ).then(res => res);
  };

  modifyStatus = ({ outcome, taskId }) => {
    const task = Records.get(`wftask@${taskId}`);

    task.att(`outcome_${outcome}`, 'true');
    task.att('cm:owner', 'admin');

    return task.save().then(res => res);
  };

  getTimesheetCalendarEventsByUserName = ({ month, year, userName }) => {
    return Records.query(
      {
        query: { month, year, userName },
        language: 'json',
        maxItems: 100,
        sourceId: 'timesheet-calendar',
        debug: false
      },
      {
        date: 'date',
        hoursCount: 'hoursCount',
        eventType: 'eventType'
      }
    ).then(res => res);
  };

  getTimesheetCalendarEventsList = function*({ month, year, userNames }) {
    const events = {};

    for (let userName of userNames) {
      const res = yield this.getTimesheetCalendarEventsByUserName({ month, year, userName });

      events[userName] = res.records || [];
    }

    return events;
  };
}
