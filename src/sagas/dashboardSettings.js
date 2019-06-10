import { call, put, takeLatest } from 'redux-saga/effects';
import {
  getAllWidgets,
  getDashboardConfig,
  initDashboardSettings,
  saveDashboardConfig,
  setAllWidgets,
  setDashboardConfig,
  setDashboardKey,
  setResultSaveDashboardConfig
} from '../actions/dashboardSettings';
import { setNotificationMessage } from '../actions/notification';
import { setLoading } from '../actions/loader';
import { setResultSaveUserMenu } from '../actions/menu';
import { t } from '../helpers/util';
import { settingsConfigForServer, settingsConfigForWeb } from '../dto/dashboardSettings';
import { getDefaultDashboardConfig } from '../constants/dashboardSettings';
import { SAVE_STATUS } from '../constants';

import * as mock from '../api/mock/dashboardSettings';

function* doInitDashboardSettingsRequest({ api, logger }, action) {
  try {
    yield put(setLoading(true));
    yield doGetWidgetsRequest({ api, logger }, action);
    yield doGetDashboardConfigRequest({ api, logger }, action);
    yield put(setLoading(false));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных')));
    logger.error('[dashboard/settings/ doInitDashboardSettingsRequest saga] error', e.message);
  }
}

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    // todo test data
    const layout = yield call(mock.getLayoutConfig);
    const { recordId } = payload;
    const config = recordId ? yield call(api.dashboard.getDashboardConfig, recordId) : getDefaultDashboardConfig;
    // const layout = config.layout;
    const webConfig = settingsConfigForWeb({ layout });

    yield put(setDashboardKey(config.key));
    yield put(setDashboardConfig(webConfig));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Настройки дашборда не получены')));
    logger.error('[dashboard/settings/ doGetDashboardConfigRequest saga] error', e.message);
  }
}

function* doGetWidgetsRequest({ api, logger }, action) {
  try {
    const apiData = yield call(api.dashboard.getAllWidgets);

    yield put(setAllWidgets(apiData));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка. Список виджетов не получен')));
    logger.error('[dashboard/settings/ doGetWidgetsRequest saga] error', e.message);
  }
}

function* doSaveSettingsRequest({ api, logger }, { payload }) {
  try {
    yield put(setLoading(true));

    const serverConfig = settingsConfigForServer(payload);
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: serverConfig,
      recordId: payload.recordId
    });
    const menuResult = yield call(api.menu.saveMenuConfig, {});
    //todo menuResult?
    yield put(
      setResultSaveDashboardConfig({
        status: SAVE_STATUS.SUCCESS,
        recordId: dashboardResult.records.id
      })
    );
    yield put(
      setResultSaveUserMenu({
        status: SAVE_STATUS.SUCCESS
      })
    );
    yield put(setLoading(false));
  } catch (e) {
    yield put(
      setResultSaveDashboardConfig({
        status: SAVE_STATUS.FAILURE,
        recordId: null
      })
    );
    yield put(
      setResultSaveUserMenu({
        status: SAVE_STATUS.SUCCESS
      })
    );
    yield put(setNotificationMessage(t('Ошибка. Данные не сохранены')));
    yield put(setLoading(false));
    logger.error('[dashboard/settings/ doSaveSettingsRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initDashboardSettings().type, doInitDashboardSettingsRequest, ea);
  yield takeLatest(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeLatest(getAllWidgets().type, doGetWidgetsRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveSettingsRequest, ea);
}

export default saga;
