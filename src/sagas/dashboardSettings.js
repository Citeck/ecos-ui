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
import { setResultSaveUserMenu } from '../actions/menu';
import { t } from '../helpers/util';
import * as dtoDB from '../dto/dashboard';
import * as dtoDBS from '../dto/dashboardSettings';
import { getDefaultDashboardConfig } from '../constants/dashboardSettings';
import { SAVE_STATUS } from '../constants';

function* doInitDashboardSettingsRequest({ api, logger }, { payload }) {
  try {
    yield put(getAllWidgets());
    yield put(getDashboardConfig(payload));
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка получения данных')));
    logger.error('[dashboard/settings/ doInitDashboardSettingsRequest saga] error', e.message);
  }
}

function* doGetDashboardConfigRequest({ api, logger }, { payload }) {
  try {
    const { recordId } = payload;
    let config = getDefaultDashboardConfig;

    if (recordId) {
      const result = yield call(api.dashboard.getDashboardConfig, recordId);

      config = dtoDB.parseGetResult(result);
    }

    const layout = config.layout;
    const webConfig = dtoDBS.getSettingsConfigForWeb({ layout });

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
    const serverConfig = dtoDBS.getSettingsConfigForServer(payload);
    const { layout, menu } = serverConfig;

    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: { layout },
      recordId: payload.recordId
    });
    const res = dtoDB.parseSaveResult(dashboardResult);

    yield put(
      setResultSaveDashboardConfig({
        status: res && res.recordId ? SAVE_STATUS.SUCCESS : SAVE_STATUS.FAILURE,
        recordId: res ? res.recordId : null
      })
    );

    //const menuResult = yield call(api.menu.saveMenuConfig, { menu });//todo connect api
    //todo menuResult?

    yield put(
      setResultSaveUserMenu({
        status: SAVE_STATUS.SUCCESS
      })
    );
  } catch (e) {
    yield put(setNotificationMessage(t('Ошибка сохранения настроек')));
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
