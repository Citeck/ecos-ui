import get from 'lodash/get';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { t } from '../helpers/util';
import { RequestStatuses } from '../constants';
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
import { setDashboardConfig as setDashboardSettingsConfig } from '../actions/dashboardSettings';
import { setNotificationMessage } from '../actions/notification';
import { selectDashboardConfigs, selectIdentificationForView, selectResetStatus } from '../selectors/dashboard';
import DashboardConverter from '../dto/dashboard';
import DashboardSettingsConverter from '../dto/dashboardSettings';
import DashboardService from '../services/dashboard';

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
      yield put(setLoading({ key: payload.key, status: false }));
      return;
    }

    yield put(setDashboardIdentification({ ...webKeyInfo, key: payload.key }));
    yield put(setDashboardConfig({ config: webConfig, key: payload.key }));
    yield put(setMobileDashboardConfig({ config: webConfigMobile, key: payload.key }));
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error5')));
    yield put(setLoading({ key: payload.key, status: false }));
    logger.error('[dashboard/ doGetDashboardRequest saga] error', e.message);
  }
}

function* doGetDashboardTitleRequest({ api, logger }, { payload }) {
  try {
    const { recordRef } = payload;
    const resTitle = yield call(api.dashboard.getTitleInfo, recordRef);
    const titleInfo = DashboardConverter.getTitleInfo(resTitle);

    yield put(setDashboardTitleInfo({ titleInfo, key: payload.key }));
  } catch (e) {
    yield put(setNotificationMessage(t('dashboard-settings.error5')));
    logger.error('[dashboard/ doGetDashboardTitleRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  yield put(setRequestResultDashboard({ key: payload.key }));

  try {
    const identification = yield select(selectIdentificationForView);
    const config = yield select(selectDashboardConfigs);

    if (config.isMobile) {
      config.mobile = payload.config;
      yield put(setMobileDashboardConfig(payload.config));
    } else {
      config.layouts = payload.config;
      yield put(setDashboardConfig({ config: payload.config, key: payload.key }));
    }

    delete config.isMobile;

    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, { config, identification });
    const res = DashboardService.parseRequestResult(dashboardResult);
    const isExistSettings = !!(yield select(state => get(state, ['dashboardSettings', res.dashboardId])));

    if (isExistSettings) {
      const settingsConfig = DashboardSettingsConverter.getSettingsForWeb({ config, ...identification });
      yield put(setDashboardSettingsConfig({ ...settingsConfig, key: res.dashboardId }));
    }

    yield put(
      setRequestResultDashboard({
        ...res,
        status: res.dashboardId ? RequestStatuses.SUCCESS : RequestStatuses.FAILURE,
        key: payload.key
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
