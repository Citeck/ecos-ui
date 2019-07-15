import { call, put, select, takeLatest } from 'redux-saga/effects';
import { getDashboardConfig, saveDashboardConfig, setDashboardConfig, setResultSaveDashboardConfig } from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { selectIdentificationForView } from '../selectors/dashboard';
import { t } from '../helpers/util';
import DashboardConverter from '../dto/dashboard';
import DashboardService from '../services/dashboard';
import { SAVE_STATUS } from '../constants';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { recordRef } = payload;
    const result = yield call(api.dashboard.getDashboardByOneOf, { recordRef });
    const data = DashboardService.checkDashboardResult(result);
    const webConfig = DashboardConverter.getDashboardForWeb(data);

    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных по дашборду')));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const identification = yield select(selectIdentificationForView);
    const config = DashboardConverter.getDashboardForServer(payload);
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, { config, identification });
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
