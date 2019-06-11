import { call, put, takeLatest } from 'redux-saga/effects';
import {
  getDashboardConfig,
  saveDashboardConfig,
  setDashboardConfig,
  setDashboardKey,
  setResultSaveDashboardConfig
} from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { t } from '../helpers/util';
import { dashboardForWeb } from '../dto/dashboard';
import { QUERY_KEYS, SAVE_STATUS } from '../constants';
import { parseDashboardSaveResult } from '../helpers/dashboard';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { recordId } = payload;
    const config = yield call(api.dashboard.getDashboardConfig, recordId);
    const layout = config && Object.keys(config) ? config[QUERY_KEYS.CONFIG_JSON].layout : {};
    const webConfig = dashboardForWeb({ layout });

    yield put(setDashboardKey(config.key));
    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных по дашборду')));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: payload.config,
      recordId: payload.recordId
    });
    const res = parseDashboardSaveResult(dashboardResult);

    yield put(
      setResultSaveDashboardConfig({
        status: res.id ? SAVE_STATUS.SUCCESS : SAVE_STATUS.FAILURE,
        recordId: res.id
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
