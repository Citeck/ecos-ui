import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  getDashboardConfig,
  getDashboardTitle,
  saveDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setLoading,
  setMobileDashboardConfig,
  setRequestResultDashboard
} from '../actions/dashboard';
import { setNotificationMessage } from '../actions/notification';
import { selectDashboardConfigs, selectIdentificationForView, selectResetStatus } from '../selectors/dashboard';
import { t } from '../helpers/util';
import DashboardConverter from '../dto/dashboard';
import DashboardService from '../services/dashboard';
import { RequestStatuses } from '../constants';

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { recordRef } = payload;

    const result = yield call(api.dashboard.getDashboardByOneOf, { recordRef });

    const data = DashboardService.checkDashboardResult(result);
    const webKeyInfo = DashboardConverter.getKeyInfoDashboardForWeb(result);
    const webConfig = DashboardConverter.getDashboardForWeb(data);
    const webConfigMobile = DashboardConverter.getMobileDashboardForWeb(data);

    const isReset = yield select(selectResetStatus);

    if (isReset) {
      console.info('[dashboard/ doGetDashboardRequest saga] info: Dashboard is unmounted');
      yield put(setLoading(false));
      return;
    }

    yield put(setDashboardIdentification(webKeyInfo));
    yield put(setDashboardConfig(webConfig));
    yield put(setMobileDashboardConfig(webConfigMobile));
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error5')));
    yield put(setLoading(false));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doGetDashboardTitleRequest({ api, logger }, { payload }) {
  try {
    const { recordRef } = payload;
    const resTitle = yield call(api.dashboard.getTitleInfo, recordRef);
    const titleInfo = DashboardConverter.getTitleInfo(resTitle);

    yield put(setDashboardTitleInfo(titleInfo));
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error5')));
    logger.error('[dashboard/ doGetDashboardTitleRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  yield put(setRequestResultDashboard({}));

  try {
    const identification = yield select(selectIdentificationForView);
    const config = yield select(selectDashboardConfigs);

    if (config.isMobile) {
      config.mobile = payload.config;
      yield put(setMobileDashboardConfig(payload.config));
    } else {
      config.layouts = payload.config;

      yield put(setDashboardConfig(payload.config));
    }
    delete config.isMobile;

    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, { config, identification });
    const res = DashboardService.parseRequestResult(dashboardResult);

    yield put(
      setRequestResultDashboard({
        status: res.dashboardId ? RequestStatuses.SUCCESS : RequestStatuses.FAILURE,
        dashboardId: res.dashboardId
      })
    );
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error6')));
    logger.error('[dashboard/ doSaveDashboardConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, doGetDashboardRequest, ea);
  yield takeLatest(getDashboardTitle().type, doGetDashboardTitleRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveDashboardConfigRequest, ea);
}

export default saga;
