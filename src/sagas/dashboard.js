import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  getDashboardConfig,
  saveDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setRequestResultDashboard
} from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { setActiveTabTitle } from '../actions/pageTabs';
import { selectIdentificationForView } from '../selectors/dashboard';
import { t } from '../helpers/util';
import DashboardConverter from '../dto/dashboard';
import DashboardService from '../services/dashboard';
import { RequestStatuses } from '../constants';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { recordRef } = payload;
    const result = yield call(api.dashboard.getDashboardByOneOf, { recordRef });
    const resTitle = yield call(api.dashboard.getTitleInfo, recordRef);

    const data = DashboardService.checkDashboardResult(result);
    const webKeyInfo = DashboardConverter.getKeyInfoDashboardForWeb(result);
    const webConfig = DashboardConverter.getDashboardForWeb(data);
    const titleInfo = DashboardConverter.getTitleInfo(resTitle);

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
    const res = DashboardService.parseRequestResult(dashboardResult);
    const newConfig = payload.config;

    yield put(
      setRequestResultDashboard({
        status: res.dashboardId ? RequestStatuses.SUCCESS : RequestStatuses.FAILURE,
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
