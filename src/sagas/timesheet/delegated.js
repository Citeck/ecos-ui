import { put, select, takeLatest } from 'redux-saga/effects';
import { getDelegatedTimesheetByParams, setDelegatedTimesheetByParams } from '../../actions/timesheet/delegated';
import { selectUserName } from '../../selectors/user';
import CommonTimesheetService from '../../services/timesheet/common';
import DelegatedTimesheetService from '../../services/timesheet/delegated';
import DelegatedTimesheetConverter from '../../dto/timesheet/delegated';

function* sagaGetDelegatedTimesheetByParams({ api, logger }, { payload }) {
  try {
    const { currentDate, action } = payload;
    const userName = yield select(selectUserName);
    const requestList = yield api.timesheetDelegated.getRequestListByAction({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      userName,
      action
    });
    console.log(requestList);
    const userNames = CommonTimesheetService.getUserNameList(requestList.records);
    const peopleList = yield api.timesheetCommon.getInfoPeopleList({ userNames });
    const othCounts = yield api.timesheetDelegated.getTotalCountsByAction({ userName, action });
    const actionCounts = CommonTimesheetService.getTotalCounts(othCounts, { [action]: requestList.totalCount || 0 });

    // const calendarEvents = yield api.timesheetCommon.getTimesheetCalendarEventsList({
    //   month: currentDate.getMonth(),
    //   year: currentDate.getFullYear(),
    //   userNames: userNames
    // });

    const list = DelegatedTimesheetService.mergeManyToOneList({
      requestList: requestList.records,
      peopleList: peopleList.records
    });

    const mergedList = DelegatedTimesheetConverter.getDelegatedEventsListForWeb(list);

    yield put(setDelegatedTimesheetByParams({ mergedList, userNames, calendarEvents: [], actionCounts }));
  } catch (e) {
    logger.error('[timesheetDelegated sagaGetDelegatedTimesheetByParams saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDelegatedTimesheetByParams().type, sagaGetDelegatedTimesheetByParams, ea);
}

export default saga;
