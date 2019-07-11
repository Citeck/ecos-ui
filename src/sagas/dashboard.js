import { isEmpty } from 'lodash';
import { call, put, takeLatest } from 'redux-saga/effects';
import { getDashboardConfig, saveDashboardConfig, setDashboardConfig, setResultSaveDashboardConfig } from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import * as dto from '../dto/dashboard';
import { SAVE_STATUS } from '../constants';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { dashboardId, recordRef } = payload;
    const result = yield call(api.dashboard.getDashboardByOneOf, { dashboardId, recordRef });

    let config;

    if (dashboardId && result) {
      config = dto.parseGetResult(result);
    } else {
      config = result && result.data ? result.data.config : dto.getDefaultDashboardConfig;
    }

    if (isEmpty(config)) {
      config = {};
    }

    const webConfig = dto.getDashboardForWeb({ ...config, dashboardId });

    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных по дашборду')));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const serverConfig = dto.getDashboardForServer(payload);
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, serverConfig);
    const res = dto.parseSaveResult(dashboardResult);

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
