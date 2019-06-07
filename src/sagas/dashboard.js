import { call, put, takeLatest } from 'redux-saga/effects';
import { getDashboardConfig, saveDashboardConfig, setDashboardConfig } from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { setLoading } from '../actions/loader';
import { t } from '../helpers/util';
//todo test
import * as mock from '../api/mock/dashboardSettings';
import { delay } from 'redux-saga';
import { dashboardForWeb } from '../dto/dashboard';
import { setMenuConfig } from '../actions/app';

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    yield put(setLoading(true));
    const apiData = yield call(api.dashboard.getDashboardConfig, payload);

    // TODO: use real query for menu & layout
    const menu = yield call(mock.getMenuConfig);
    const layout = yield call(mock.getLayoutConfig);
    const webConfig = dashboardForWeb({ menu, layout });

    console.log('doGetDashboardConfigRequest', apiData);

    yield put(setMenuConfig(menu));
    yield put(setDashboardConfig(webConfig));
    yield put(setLoading(false));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных по дашборду')));
    logger.error('[dashboard/ doGetDashboardConfigRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    yield put(setLoading(true));
    yield delay(2000);
    // const webConfig = mock.getConfigPage();
    // yield put(setDashboardConfig(webConfig));
    yield put(setDashboardConfig(payload));
    yield put(setLoading(false));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка сохранения дашборда')));
    logger.error('[dashboard/ doSaveDashboardConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveDashboardConfigRequest, ea);
}

export default saga;
