import { call, put, select, takeEvery } from 'redux-saga/effects';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { backExecuteAction, getActions, runExecuteAction, setActions } from '../actions/recordActions';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import PageService from '../services/PageService';
import { DefaultActionTypes } from '../components/Records/actions';
import { URL } from '../constants';

function* sagaGetActions({ api, logger }, { payload }) {
  try {
    const { record, stateId, context } = payload;
    let list = yield call(api.recordActions.getActions, { records: record, context });

    if (isEmpty(list)) {
      list = [];
    }

    yield put(setActions({ stateId, list }));
  } catch (e) {
    logger.error('[recordActions/sagaGetActions saga] error', e.message);
  }
}

function* sagaExecuteAction({ api, logger }, { payload }) {
  try {
    const { record, action, stateId } = payload;
    const res = yield call(api.recordActions.executeAction, { records: record, action });
    console.log(action.type, res);
    yield put(backExecuteAction({ stateId }));

    if (res === null) {
      yield put(setNotificationMessage(t('records-actions.action-failed')));
    }

    if (action.type === DefaultActionTypes.DELETE) {
      const location = yield select(state => state.router.location);
      const { pathname, search } = location;
      const isShowTabs = yield select(state => get(state, 'pageTabs.isShow', false));
      const home = URL.DASHBOARD;
      if (isShowTabs) {
        const page = PageService.getWhereLinkOpen({ subsidiaryLink: pathname + search }) || home; //todo
        PageService.changeUrlLink(page);
      } else {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.history.go(URL.DASHBOARD);
        }
      }
    }
  } catch (e) {
    yield put(setNotificationMessage(t('records-actions.action-failed')));
    logger.error('[recordActions/sagaExecuteAction saga] error', e.message);
  }
}

function* recordActions(ea) {
  yield takeEvery(getActions().type, sagaGetActions, ea);
  yield takeEvery(runExecuteAction().type, sagaExecuteAction, ea);
}

export default recordActions;
