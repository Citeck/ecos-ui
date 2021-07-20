import { RecordService } from '../recordService';
import Records from '../../components/Records';
import { SourcesId } from '../../constants';
import { TASKS_URI } from '../../constants/alfresco';
import { TimesheetSourcesId } from '../../constants/timesheet';

export function getQueryFewValues(prefix, values) {
  return values && values.map(value => `${prefix}${value}`).join(' OR ');
}

export function getQueryAndOrs(prefix, values) {
  const ORs = getQueryFewValues(prefix, values);

  if (!ORs) {
    return '';
  }

  return `AND (${ORs})`;
}

export class TimesheetCommonApi extends RecordService {
  getTimesheetStatusList = ({ month, year, userNames, statuses }) => {
    const query = { month, year, userNames };

    if (Array.isArray(statuses) && statuses.length) {
      query.status = statuses;
    }

    return Records.query(
      {
        query,
        language: 'json',
        maxItems: 100,
        sourceId: TimesheetSourcesId.STATUS,
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
        sourceId: TimesheetSourcesId.CALENDAR,
        debug: false
      },
      {
        date: 'date',
        hoursCount: 'hoursCount',
        eventType: 'eventType'
      }
    ).then(res => res);
  };

  getTimesheetCalendarEventsList = async ({ month, year, userNames }) => {
    const events = {};

    await Promise.all(
      userNames.map(async userName => {
        const res = await this.getTimesheetCalendarEventsByUserName({ month, year, userName });

        events[userName] = res.records || [];

        return false;
      })
    );

    return events;
  };

  getInfoPeopleList = ({ userNames }) => {
    if (!userNames || !userNames.length) {
      return {};
    }

    const queryNames = getQueryFewValues('@cm:userName:', userNames);

    return Records.query(
      {
        query: `${queryNames}`,
        language: 'fts-alfresco',
        maxItems: 100,
        sourceId: SourcesId.PEOPLE,
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

  modifyStatus = ({ outcome, taskId, currentUser, comment = '' }) => {
    const task = Records.get(`${SourcesId.TASK}@${taskId}`);

    task.att(`outcome_${outcome}`, true);
    task.att('cm:owner', currentUser);

    if (comment) {
      task.att('comment', comment);
    }

    return task.save().then(res => res);
  };

  modifyEventHours = ({ userName, value, date, eventType }) => {
    const event = Records.get(`timesheet-calendar@${userName}-${date}-${eventType}`);

    event.att('value', value);

    return event.save().then(res => res);
  };

  getTotalCountDelegated = ({ month, year, userName }) => {
    const queryType = `AND (@timesheet:fillingDelegated:true OR @timesheet:approvalDelegated:true)`;
    const queryTypeUser = `AND (@timesheet:fillingDeputy:${userName} OR @timesheet:approvalDeputy:${userName})`;
    const queryTime = `AND @timesheet:currentYear:${year} AND @timesheet:currentMonth:${month + 1}`;

    return Records.query({
      query: {
        query: `TYPE:'timesheet:Request' ${queryType} ${queryTypeUser} ${queryTime}`,
        language: 'fts-alfresco',
        maxItems: 100,
        debug: false
      },
      attributes: {
        userName: 'timesheet:requestorUsername'
      }
    }).then(res => res.totalCount);
  };

  getHoursByDay = ({ date, userName, eventType }) => {
    const [day, month, year] = date.split('.');

    return Records.query({
      query: {
        query: { day, month, year, userName, eventType },
        language: 'json',
        maxItems: 100,
        sourceId: 'timesheet-calendar',
        debug: false
      },
      attributes: {
        date: 'date',
        hoursCount: 'hoursCount',
        eventType: 'eventType'
      }
    }).then(res => res);
  };
}
