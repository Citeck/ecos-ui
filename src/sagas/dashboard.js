import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  getDashboardConfig,
  saveDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setResultSaveDashboardConfig
} from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { selectIdentificationForView } from '../selectors/dashboard';
import { t } from '../helpers/util';
import DashboardConverter from '../dto/dashboard';
import DashboardService from '../services/dashboard';
import { SAVE_STATUS } from '../constants';
import { setActiveTabTitle } from '../actions/pageTabs';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { recordRef } = payload;
    const result = yield call(api.dashboard.getDashboardByOneOf, { recordRef });
    const data = DashboardService.checkDashboardResult(result);
    const webKeyInfo = DashboardConverter.getKeyInfoDashboardForWeb(data);
    const webConfig = DashboardConverter.getDashboardForWeb(data);
    const titleInfo = DashboardConverter.getTitleInfo(yield call(api.dashboard.getTitleInfo, recordRef));

    yield put(setDashboardTitleInfo(titleInfo));
    yield put(setActiveTabTitle(titleInfo.name));
    yield put(setDashboardIdentification(webKeyInfo));
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
    const newConfig = payload.config;

    yield put(
      setResultSaveDashboardConfig({
        status: res.dashboardId ? SAVE_STATUS.SUCCESS : SAVE_STATUS.FAILURE,
        dashboardId: res.dashboardId
      })
    );

    yield put(setDashboardConfig(newConfig));
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
