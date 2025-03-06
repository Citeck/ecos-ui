import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { NotificationManager } from '@/services/notifications';

import { RequestStatuses } from '../constants';
import { t } from '../helpers/util';
import { getRefWithAlfrescoPrefix } from '../helpers/ref';
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
  setWarningMessage,
} from '../actions/dashboard';
import { setDashboardConfig as setDashboardSettingsConfig } from '../actions/dashboardSettings';
import { selectDashboardConfigs, selectIdentificationForView, selectResetStatus } from '../selectors/dashboard';
import DashboardConverter from '../dto/dashboard';
import DashboardService from '../services/dashboard';
import { selectNewVersionConfig, selectSelectedWidgetsById } from '../selectors/dashboardSettings';
import { selectCurrentWorkspaceIsBlocked } from '../selectors/workspaces';

export function* _parseConfig({ api }, { recordRef, config }) {
  const migratedConfig = DashboardService.migrateConfigFromOldVersion(config);
  const newConfig = yield select(() => selectNewVersionConfig(migratedConfig));

  newConfig.widgets = yield call(api.dashboard.getFilteredWidgets, newConfig.widgets, { recordRef });
  const widgetsById = yield select(() => selectSelectedWidgetsById(newConfig));

  return DashboardConverter.getNewDashboardForWeb(newConfig, widgetsById, migratedConfig.version);
}

function* doGetDashboardRequest({ api }, { payload }) {
  const workspaceIsBlocked = yield select(selectCurrentWorkspaceIsBlocked);

  try {
    const { dashboardId, recordRef } = payload;
    const recordIsExist = yield call(api.app.recordIsExist, recordRef, true);

    if (recordRef && !recordIsExist) {
      yield put(setWarningMessage({ key: payload.key, message: t('record.not-found.message') }));
      yield put(setLoading({ key: payload.key, status: false }));

      return;
    }

    const hasRecordReadPermission = yield call(api.app.hasRecordReadPermission, recordRef, true);

    if (recordRef && !hasRecordReadPermission) {
      yield put(setWarningMessage({ key: payload.key, message: t('record.permission-denied.message') }));
      yield put(setLoading({ key: payload.key, status: false }));

      return;
    }
    const result = yield call(api.dashboard.getDashboardByOneOf, { dashboardId, recordRef: getRefWithAlfrescoPrefix(recordRef) });

    const modelAttributes = yield call(api.dashboard.getModelAttributes, result.key);
    const webKeyInfo = DashboardConverter.getKeyInfoDashboardForWeb(result);
    const webConfigs = yield _parseConfig({ api }, { config: result.config, recordRef });
    const isReset = yield select(selectResetStatus);

    if (isReset) {
      throw new Error('info: Dashboard is unmounted');
    }
    yield put(setDashboardIdentification({ ...webKeyInfo, key: payload.key }));
    yield put(
      setDashboardConfig({
        config: get(webConfigs, 'config.layouts', []),
        originalConfig: result.config,
        modelAttributes,
        key: payload.key,
      }),
    );
    yield put(setMobileDashboardConfig({ config: get(webConfigs, 'config.mobile', []), key: payload.key }));
  } catch (e) {
    yield put(setLoading({ key: payload.key, status: false }));

    if (!workspaceIsBlocked || !get(window, 'Citeck.navigator.WORKSPACES_ENABLED', false)) {
      NotificationManager.error(t('dashboard.error.get-config'), t('error'));
    }

    console.error('[dashboard/ doGetDashboardRequest saga] error', e);
  }
}

function* doGetDashboardTitleRequest({ api }, { payload }) {
  try {
    const { dashboardId, recordRef } = payload;
    const resTitle = yield call(api.dashboard.getTitleInfo, recordRef, dashboardId);
    const titleInfo = DashboardConverter.getTitleInfo(resTitle);

    yield put(setDashboardTitleInfo({ titleInfo, key: payload.key }));
  } catch (e) {
    NotificationManager.error(t('dashboard.error.get-title'), t('error'));
    console.error('[dashboard/ doGetDashboardTitleRequest saga] error', e);
  }
}

function* doSaveDashboardConfigRequest({ api }, { payload }) {
  yield put(setRequestResultDashboard({ key: payload.key }));

  try {
    let { config, recordRef, callback } = payload;
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

    const forWeb = yield _parseConfig({ api }, { config, recordRef });

    if (recordRef && identification.appliedToRef) {
      recordRef = getRefWithAlfrescoPrefix(recordRef);
    } else {
      recordRef = '';
    }

    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, { config, identification, recordRef });

    if (!dashboardResult || !dashboardResult.id) {
      throw new Error('Incorrect result for saving');
    }

    const res = DashboardService.parseRequestResult(dashboardResult);
    const isExistSettings = !!(yield select((state) => get(state, ['dashboardSettings', res.dashboardId])));

    if (isExistSettings) {
      yield put(
        setDashboardSettingsConfig({
          ...forWeb,
          key: res.dashboardId,
          originalConfig: payload.config,
        }),
      );
    }

    yield put(
      setDashboardConfig({
        config: get(forWeb, 'config.layouts', []),
        originalConfig: payload.config,
        key: payload.key,
      }),
    );

    yield put(
      setMobileDashboardConfig({
        config: get(forWeb, 'config.mobile', []),
        key: payload.key,
      }),
    );

    yield put(
      setRequestResultDashboard({
        ...res,
        status: res.dashboardId ? RequestStatuses.SUCCESS : RequestStatuses.FAILURE,
        key: payload.key,
      }),
    );

    isFunction(callback) && callback();
  } catch (e) {
    yield put(setLoading({ key: payload.key, status: false }));
    NotificationManager.error(t('dashboard.error.save-config'), t('error'));
    console.error('[dashboard/ doSaveDashboardConfigRequest saga] error', e);
  }
}

function* saga(ea) {
  yield takeLatest(getDashboardConfig().type, doGetDashboardRequest, ea);
  yield takeLatest(getDashboardTitle().type, doGetDashboardTitleRequest, ea);
  yield takeLatest(saveDashboardConfig().type, doSaveDashboardConfigRequest, ea);
}

export default saga;
