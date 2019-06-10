import { call, put, takeLatest } from 'redux-saga/effects';
import { getDashboardConfig, saveDashboardConfig, setDashboardConfig, setDashboardKey, setResultSaveDashboard } from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { setLoading } from '../actions/loader';
import { t } from '../helpers/util';
import { dashboardForWeb } from '../dto/dashboard';
import { SAVE_STATUS } from '../constants';

import * as mock from '../api/mock/dashboardSettings';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    // todo test data
    const layout = yield call(mock.getLayoutConfig);
    yield put(setLoading(true));

    const { recordId } = payload;
    const config = yield call(api.dashboard.getDashboardConfig, recordId);
    // const layout = config.layout;
    const webConfig = dashboardForWeb({ layout });

    yield put(setDashboardKey(config.key));
    yield put(setDashboardConfig(webConfig));
    yield put(setLoading(false));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных по дашборду')));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    yield put(setLoading(true));

    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: payload.config,
      recordId: payload.recordId
    });

    yield put(setResultSaveDashboard({ status: SAVE_STATUS.SUCCESS }));
    yield put(setLoading(false));
    //todo temp dashboardResult?
    yield put(setDashboardConfig(payload));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка сохранения дашборда')));
    logger.error('[dashboard/ doSaveDashboardConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, doGetDashboardRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveDashboardConfigRequest, ea);
}

export default saga;
