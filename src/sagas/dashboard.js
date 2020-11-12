import get from 'lodash/get';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import { RequestStatuses } from '../constants';
import { t } from '../helpers/util';
import { createOldVersionUrlDocument } from '../helpers/urls';
import {
  getDashboardConfig,
  getDashboardTitle,
  saveDashboardConfig,
  setDashboardConfig,
  setDashboardIdentification,
  setDashboardTitleInfo,
  setLoading,
  setMobileDashboardConfig,
  setRequestResultDashboard,
  setWarningMessage
} from '../actions/dashboard';
import { setDashboardConfig as setDashboardSettingsConfig } from '../actions/dashboardSettings';
import { selectDashboardConfigs, selectIdentificationForView, selectResetStatus } from '../selectors/dashboard';
import DashboardConverter from '../dto/dashboard';
import DashboardService from '../services/dashboard';
import PageService from '../services/PageService';
import { selectNewVersionConfig, selectSelectedWidgetsById } from '../selectors/dashboardSettings';

function* _parseConfig({ api, logger }, { recordRef, config }) {
  const migratedConfig = DashboardService.migrateConfigFromOldVersion(config);
  const newConfig = yield select(() => selectNewVersionConfig(migratedConfig));
  newConfig.widgets = yield call(api.dashboard.getFilteredWidgets, newConfig.widgets, { recordRef });
  const widgetsById = yield select(() => selectSelectedWidgetsById(newConfig));

  return DashboardConverter.getNewDashboardForWeb(newConfig, widgetsById, migratedConfig.version);
}

function* doGetDashboardRequest({ api, logger }, { payload }) {
  try {
    const { recordRef } = payload;
    const redirect = yield call(api.dashboard.isRedirectOld, recordRef);

    if (redirect) {
      PageService.changeUrlLink(createOldVersionUrlDocument(recordRef), { reopenBrowserTab: true });
      return;
    }

    const recordIsExist = yield call(api.app.recordIsExist, recordRef, true);

    if (!recordIsExist) {
      yield put(setWarningMessage({ key: payload.key, message: t('record.not-found.message') }));
      yield put(setLoading({ key: payload.key, status: false }));

      return;
    }

    const hasRecordReadPermission = yield call(api.app.hasRecordReadPermission, recordRef, true);

    if (!hasRecordReadPermission) {
      yield put(setWarningMessage({ key: payload.key, message: t('record.permission-denied.message') }));
      yield put(setLoading({ key: payload.key, status: false }));

      return;
    }

    const result = yield call(api.dashboard.getDashboardByOneOf, { recordRef });
    const webKeyInfo = DashboardConverter.getKeyInfoDashboardForWeb(result);
    const webConfigs = yield _parseConfig({ api, logger }, { config: result.config, recordRef });
    const isReset = yield select(selectResetStatus);

    if (isReset) {
      throw new Error('info: Dashboard is unmounted');
    }

    yield put(setDashboardIdentification({ ...webKeyInfo, key: payload.key }));
    yield put(
      setDashboardConfig({
        config: get(webConfigs, 'config.layouts', []),
        originalConfig: result.config,
        key: payload.key
      })
    );
    yield put(setMobileDashboardConfig({ config: get(webConfigs, 'config.mobile', []), key: payload.key }));
  } catch (e) {
    yield put(setLoading({ key: payload.key, status: false }));
    NotificationManager.error(t('dashboard.error.get-config'), t('error'));
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
    NotificationManager.error(t('dashboard.error.get-title'), t('error'));
    logger.error('[dashboard/ doGetDashboardTitleRequest saga] error', e.message);
  }
}

function* doSaveDashboardConfigRequest({ api, logger }, { payload }) {
  yield put(setRequestResultDashboard({ key: payload.key }));

  try {
    let config = payload.config;
    const identification = yield select(selectIdentificationForView);

    if (!get(config, 'version')) {
      const dashboardConfig = yield select(selectDashboardConfigs);

      if (dashboardConfig.isMobile) {
        dashboardConfig.mobile = payload.config;
      } else {
        dashboardConfig.layouts = payload.config;
      }

      delete dashboardConfig.isMobile;

      config = dashboardConfig;
    }

    const forWeb = yield _parseConfig({ api, logger }, { config, recordRef: payload.recordRef });
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, { config, identification });
    const res = DashboardService.parseRequestResult(dashboardResult);
    const isExistSettings = !!(yield select(state => get(state, ['dashboardSettings', res.dashboardId])));

    if (isExistSettings) {
      yield put(
        setDashboardSettingsConfig({
          ...forWeb,
          key: res.dashboardId,
          originalConfig: payload.config
        })
      );
    }

    yield put(
      setDashboardConfig({
        config: get(forWeb, 'config.layouts', []),
        originalConfig: payload.config,
        key: payload.key
      })
    );
    yield put(
      setMobileDashboardConfig({
        config: get(forWeb, 'config.mobile', []),
        key: payload.key
      })
    );

    yield put(
      setRequestResultDashboard({
        ...res,
        status: res.dashboardId ? RequestStatuses.SUCCESS : RequestStatuses.FAILURE,
        key: payload.key
      })
    );
  } catch (e) {
    yield put(setLoading({ key: payload.key, status: false }));
    NotificationManager.error(t('dashboard.error.save-config'), t('error'));
    logger.error('[dashboard/ doSaveDashboardConfigRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, doGetDashboardRequest, ea);
  yield takeLatest(getDashboardTitle().type, doGetDashboardTitleRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveDashboardConfigRequest, ea);
}

export default saga;
