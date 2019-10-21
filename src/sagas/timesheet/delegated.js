import { put, select, takeLatest } from 'redux-saga/effects';
import { getDelegatedTimesheetByParams, setDelegatedTimesheetByParams } from '../../actions/timesheet/delegated';
import { selectUserName } from '../../selectors/user';
import CommonTimesheetService from '../../services/timesheet/common';
import { StatusActionFilters } from '../../helpers/timesheet/constants';

function* sagaGetDelegatedTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate, action } = payload;
    const userName = yield select(selectUserName);
    const requestList = yield api.timesheetDelegated.getRequestListByAction({ userName, action });
    console.log(requestList);
    const userNames = CommonTimesheetService.getUserNameList(requestList.records);
    const statuses = yield api.timesheetCommon.getTimesheetStatusList({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userNames
    });
    const actionCounts = {
      all: 100,
      [StatusActionFilters.FILL]: requestList.totalCount,
      [StatusActionFilters.APPROVE]: requestList.totalCount
    };

    // const calendarEvents = yield api.timesheetCommon.getTimesheetCalendarEventsList({
    //   month: currentDate.getMonth(),
    //   year: currentDate.getFullYear(),
    //   userNames: userNames
    // });

    // const list = SubordinatesTimesheetService.mergeToSubordinatesEventsList({
    //   subordinates: subordinates.records,
    //   calendarEvents,
    //   statuses: statuses.records
    // });
    //
    // const mergedList = SubordinatesTimesheetConverter.getSubordinatesEventsListForWeb(list);

    yield put(setDelegatedTimesheetByParams({ userNames, statuses, actionCounts }));
  } catch (e) {
    logger.error('[timesheetDelegated sagaGetDelegatedTimesheetByParams saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDelegatedTimesheetByParams().type, sagaGetDelegatedTimesheetByParams, ea);
}

export default saga;
