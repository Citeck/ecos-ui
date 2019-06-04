import { delay } from 'redux-saga';
import { put, takeLatest } from 'redux-saga/effects';
import { getDashboardConfig, saveDashboardConfig, setDashboardConfig } from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
//todo test
import * as mock from '../api/mock/dashboardSettings';

function* doGetDashboardConfigRequest({ api, logger }, action) {
  try {
    yield delay(2000);
    const webConfig = mock.getConfigPage();
    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка')));
    logger.error('[dashboard/ doGetDashboardConfigRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, action) {
  try {
    yield delay(2000);
    // const webConfig = mock.getConfigPage();
    // yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка')));
    logger.error('[dashboard/ doSaveDashboardConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveDashboardConfigRequest, ea);
}

export default saga;
