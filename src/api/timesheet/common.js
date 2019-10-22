import { RecordService } from '../recordService';
import Records from '../../components/Records';
import { TASKS_URI } from '../../constants/alfresco';

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
        taskId: 'taskId',
        nodeRef: 'nodeRef'
      }
    ).then(res => res);
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

  getInfoPeopleList = ({ userNames }) => {
    const queryNames = userNames.map(name => `@ggodic:geSupervisorId:${name}`).join(' OR ');

    if (!queryNames) {
      return {};
    }

    return Records.query(
      {
        query: `${queryNames}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: 'people',
        debug: false
      },
      {
        userName: 'userName',
        isAvailable: 'isAvailable',
        firstName: 'cm:firstName',
        lastName: 'cm:lastName',
        middleName: 'cm:middleName',
        firstNameRus: 'ggodic:firstNameRus',
        lastNameRus: 'ggodic:lastNameRus',
        middleNameRus: 'ggodic:middleNameRus'
      }
    ).then(res => res);
  };

  changeTaskOwner = ({ taskId, currentUser }) => {
    const data = { cm_owner: currentUser, action: 'claim' };

    return this.putJson(`${TASKS_URI}change-task-owner/${taskId}`, data, true).then(resp => resp);
  };

  modifyStatus = function*({ outcome, taskId, currentUser }) {
    yield this.changeTaskOwner({ taskId, currentUser });

    const task = Records.get(`wftask@${taskId}`);

    task.att(`outcome_${outcome}`, 'true');
    task.att('cm:owner', currentUser);

    return task.save().then(res => res);
  };

  modifyEventHours = ({ userName, value, date, eventType }) => {
    const event = Records.get(`timesheet-calendar@${userName}-${date}-${eventType}`);

    event.att('value', value);

    return event.save().then(res => res);
  };
}
