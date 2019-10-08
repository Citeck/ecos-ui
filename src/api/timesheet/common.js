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
      events[userName] = yield this.getTimesheetCalendarEventsByUserName({ month, year, userName });
      // events[userName] = {
      //   "records": [
      //     {"id":"timesheet-calendar@212000059-01.10.2019-daytime-work", "attributes":{"date":"02.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-02.10.2019-daytime-work", "attributes":{"date":"02.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-03.10.2019-daytime-work", "attributes":{"date":"03.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-04.10.2019-daytime-work", "attributes":{"date":"04.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-07.10.2019-daytime-work", "attributes":{"date":"07.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-08.10.2019-daytime-work", "attributes":{"date":"08.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-09.10.2019-daytime-work", "attributes":{"date":"09.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-10.10.2019-daytime-work", "attributes":{"date":"10.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-11.10.2019-daytime-work", "attributes":{"date":"11.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-14.10.2019-daytime-work", "attributes":{"date":"14.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-15.10.2019-daytime-work", "attributes":{"date":"15.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-16.10.2019-daytime-work", "attributes":{"date":"16.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-17.10.2019-daytime-work", "attributes":{"date":"17.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-18.10.2019-daytime-work", "attributes":{"date":"18.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-21.10.2019-daytime-work", "attributes":{"date":"21.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-22.10.2019-daytime-work", "attributes":{"date":"22.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-23.10.2019-daytime-work", "attributes":{"date":"23.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-24.10.2019-daytime-work", "attributes":{"date":"24.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-25.10.2019-daytime-work", "attributes":{"date":"25.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-28.10.2019-daytime-work", "attributes":{"date":"28.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-29.10.2019-daytime-work", "attributes":{"date":"29.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-30.10.2019-daytime-work", "attributes":{"date":"30.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-31.10.2019-daytime-work", "attributes":{"date":"31.10.2019","hoursCount":"8","eventType":"daytime-work"}},
      //     {"id":"timesheet-calendar@212000059-31.10.2019-overtime-work", "attributes":{"date":"31.10.2019","hoursCount":"8","eventType":"overtime-work"}}
      //   ].map(item=>item.attributes),
      //   "hasMore": false,
      //   "totalCount": 24
      // }.records;
    }

    return events;
  };
}
