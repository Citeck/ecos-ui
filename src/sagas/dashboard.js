import { call, put, takeLatest } from 'redux-saga/effects';
import { getDashboardConfig, saveDashboardConfig, setDashboardConfig, setResultSaveDashboardConfig } from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import DashboardConverter from '../dto/dashboard';
import DashboardService from '../services/dashboard';
import { SAVE_STATUS } from '../constants';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { dashboardId, recordRef } = payload;
    const result = yield call(api.dashboard.getDashboardByOneOf, { dashboardId, recordRef });
    const data = DashboardService.processDashboardResult(result);
    const webConfig = DashboardConverter.getDashboardForWeb(data);

    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных по дашборду')));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const serverConfig = DashboardConverter.getDashboardForServer(payload);
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, serverConfig);
    const res = DashboardService.parseSaveResult(dashboardResult);

    yield put(
      setResultSaveDashboardConfig({
        status: res.dashboardId ? SAVE_STATUS.SUCCESS : SAVE_STATUS.FAILURE,
        dashboardId: res.dashboardId
      })
    );

    yield put(setDashboardConfig(payload.config));
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
