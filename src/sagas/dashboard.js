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
import * as dto from '../dto/dashboard';
import { SAVE_STATUS } from '../constants';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { recordId } = payload;
    const result = yield call(api.dashboard.getDashboardConfig, recordId);
    const config = dto.parseGetResult(result);

    if (config && Object.keys(config).length) {
      const webConfig = dto.getDashboardForWeb(config);

      yield put(setDashboardKey(config.key));
      yield put(setDashboardConfig(webConfig));
    }
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
