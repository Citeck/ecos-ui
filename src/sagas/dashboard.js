import { call, put, takeLatest } from 'redux-saga/effects';
import { getDashboardConfig, setDashboardConfig } from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { setLoading } from '../actions/loader';
import { t } from '../helpers/util';
//todo test
import * as mock from '../api/mock/dashboardSettings';

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    yield put(setLoading(true));
    const apiData = yield call(api.dashboard.getDashboardConfig, payload);
    console.log('doGetDashboardConfigRequest', apiData);
    const webConfig = mock.getConfigPage();
    yield put(setDashboardConfig(webConfig));
    yield put(setLoading(false));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных по дашборду')));
    logger.error('[dashboard/ doGetDashboardConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
}

export default saga;
