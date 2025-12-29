import get from 'lodash/get';
import isUndefined from 'lodash/isUndefined';
import { call, put, select, takeEvery } from 'redux-saga/effects';

import {
  getAvailableWidgets,
  getCheckUpdatedDashboardConfig,
  getDashboardConfig,
  getDashboardKeys,
  initDashboardSettings,
  resetConfigToDefault,
  saveDashboardConfig,
  setAvailableWidgets,
  setCheckUpdatedDashboardConfig,
  setDashboardConfig,
  setDashboardData,
  setDashboardKeys,
  setLoading,
  setLoadingKeys,
  setRequestResultDashboard
} from '../actions/dashboardSettings';
import { RequestStatuses } from '../constants';
import { CONFIG_VERSION } from '../constants/dashboard';
import DashboardConverter from '../dto/dashboard';
import DashboardSettingsConverter from '../dto/dashboardSettings';
import { getRefExceptAlfrescoPrefix, getRefWithAlfrescoPrefix } from '../helpers/ref';
import { getSearchParams } from '../helpers/urls';
import { t } from '../helpers/util';
import { selectIdentificationForSet } from '../selectors/dashboard';
import {
  selectIdentification,
  selectNewVersionConfig,
  selectOriginalConfig,
  selectRecordRef,
  selectSelectedWidgetsById
} from '../selectors/dashboardSettings';
import { selectIsAdmin, selectUserName } from '../selectors/user';
import DashboardService from '../services/dashboard';
import UserLocalSettingsService from '../services/userLocalSettings';

import { NotificationManager } from '@/services/notifications';

function* doInitDashboardSettingsRequest({ api }, { payload }) {
  try {
    // добавить проверку: если конфиг уже есть, не отправлять
    yield put(getDashboardConfig(payload));
  } catch (e) {
    console.error('[dashboard-settings/ doInitDashboardSettingsRequest saga] error', e);
  }
}

function* doGetDashboardConfigRequest({ api }, { payload }) {
  const { key, dashboardId, recordRef } = payload;

  try {
    let keyRef = recordRef ? getRefWithAlfrescoPrefix(recordRef) : null;
    const { config, ...result } = yield call(api.dashboard.getDashboardByOneOf, { ...payload, dashboardId, recordRef: keyRef });
    const modelAttributes = yield call(api.dashboard.getModelAttributes, result.key);
    const migratedConfig = DashboardService.migrateConfigFromOldVersion(config);
    const newConfig = yield select(() => selectNewVersionConfig(migratedConfig));
    const widgetsById = yield select(() => selectSelectedWidgetsById(newConfig));
    const data = DashboardService.checkDashboardResult(result);
    const webConfigs = DashboardSettingsConverter.getSettingsForWeb(newConfig, widgetsById, migratedConfig.version);

    webConfigs.identification = DashboardConverter.getKeyInfoDashboardForWeb(data).identification || {};

    if (!keyRef && result.appliedToRef) {
      keyRef = result.appliedToRef;
    }

    if (keyRef && !webConfigs.identification.key) {
      webConfigs.identification.key = keyRef;
    }

    const _recordRef = get(getSearchParams(), 'recordRef') || getRefExceptAlfrescoPrefix(keyRef);

    yield put(setDashboardData({ key, recordRef: recordRef || _recordRef }));
    yield put(setDashboardConfig({ ...webConfigs, key, originalConfig: config, modelAttributes }));

    yield put(getAvailableWidgets({ type: data.type, key }));
    yield put(getDashboardKeys({ ...payload, recordRef: recordRef || _recordRef }));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.get-config'), t('error'));
    console.error('[dashboard-settings/ doGetDashboardConfigRequest saga] error', e);
  } finally {
    yield put(setLoading({ key: payload.key, status: false }));
  }
}

function* doGetWidgetsRequest({ api }, { payload }) {
  try {
    const widgets = yield call(api.dashboard.getWidgetsByDashboardType, payload.type);

    yield put(setAvailableWidgets({ widgets, key: payload.key }));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.get-widget-list'), t('error'));
    console.error('[dashboard-settings/ doGetWidgetsRequest saga] error', e);
  }
}

function* doGetDashboardKeys({ api }, { payload }) {
  try {
    yield put(setLoadingKeys({ status: true, key: payload.key }));

    const identification = yield select(state => selectIdentification(state, payload.key));
    const keys = yield call(api.dashboard.getDashboardTypes, payload, identification.key);
    const recordRef = yield select(state => selectRecordRef(state, payload.key));

    if (recordRef) {
      const displayName = get(yield call(api.dashboard.getTitleInfo, recordRef), 'displayName');

      keys.unshift({ key: recordRef, displayName });
    }

    yield put(setDashboardKeys({ keys, key: payload.key }));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.get-board-key'), t('error'));
    console.error('[dashboard-settings/ doGetDashboardKeys saga] error', e);
  } finally {
    yield put(setLoadingKeys({ status: false, key: payload.key }));
  }
}

function* doCheckUpdatedSettings({ api }, { payload }) {
  try {
    const identification = yield select(selectIdentificationForSet, payload.key);
    const user = payload.isForAllUsers ? null : identification.user;
    const eqKey = identification.key === payload.dashboardKey;
    const hasUser = !!identification.user;

    let saveWay = DashboardService.defineWaySavingDashboard(eqKey, payload.isForAllUsers, hasUser);
    let dashboardId = identification.id;

    if (saveWay === DashboardService.SaveWays.CONFIRM) {
      const checkResult = yield call(api.dashboard.checkExistDashboard, {
        key: payload.dashboardKey,
        type: identification.type,
        isCustomDashboard: payload.isCustomDashboard,
        user
      });

      if (checkResult.id) {
        dashboardId = checkResult.id;
      }

      if (!checkResult.exist) {
        saveWay = DashboardService.SaveWays.CREATE;
      }
    }

    if (saveWay === DashboardService.SaveWays.CREATE) {
      dashboardId = '';
    }

    yield put(setCheckUpdatedDashboardConfig({ saveWay, dashboardId, key: payload.key }));
  } catch (e) {
    NotificationManager.error(t('dashboard-settings.error.check-updates'), t('error'));
    console.error('[dashboard-settings/ doCheckUpdatedSettings saga] error', e);
  }
}

function* doSaveSettingsRequest({ api }, { payload }) {
  try {
    const identification = yield select(selectIdentificationForSet, payload.key);
    const newIdentification = payload.newIdentification || {};
    const isAdmin = yield select(selectIsAdmin);
    const identificationData = { ...identification, ...newIdentification };
    let recordRef = yield select(state => selectRecordRef(state, payload.key));

    if (!isAdmin) {
      const user = yield select(state => {
        return selectUserName(state);
      });

      if (!user) {
        throw new Error('No user name');
      }

      identificationData.user = user;
    }

    if (recordRef && identificationData.key === recordRef) {
      recordRef = getRefWithAlfrescoPrefix(recordRef);
    } else {
      recordRef = '';
    }

    const originalConfig = yield select(state => selectOriginalConfig(state, payload.key));
    const dashboardResult = yield call(api.dashboard.saveDashboardConfig, {
      config: {
        ...originalConfig,
        [CONFIG_VERSION]: DashboardSettingsConverter.getNewSettingsConfigForServer(payload),
        version: CONFIG_VERSION
      },
      identification: identificationData,
      recordRef
    });

    const parseDashboard = DashboardService.parseRequestResult(dashboardResult);
    const request = {
      status: parseDashboard.dashboardId ? RequestStatuses.SUCCESS : RequestStatuses.FAILURE,
      dashboardId: parseDashboard.dashboardId
    };

    Object.keys(get(payload, 'widgets')).forEach(key => {
      const widgets = get(payload, ['widgets', key], []);
      const clearWidgetLSData = widget => {
        if (Array.isArray(widget)) {
          widget.forEach(clearWidgetLSData);
          return;
        }

        const dashletKey = UserLocalSettingsService.getDashletKey(newIdentification.id, widget.id);
        const isCollapsed = get(widget, 'props.config.collapsed');
        const isCollapsedFromLS = UserLocalSettingsService.getDashletProperty(dashletKey, 'isCollapsed');

        if (!isUndefined(isCollapsedFromLS) && isCollapsed !== isCollapsedFromLS) {
          UserLocalSettingsService.setDataByKey(dashletKey, { isCollapsed: undefined });
        }
      };

      widgets.forEach(clearWidgetLSData);
    });

    yield call(api.dashboard.deleteFromCache, [
      DashboardService.getCacheKey({ type: identification.key, user: identification.user }),
      DashboardService.getCacheKey({ type: newIdentification.key, user: newIdentification.user })
    ]);
    yield put(setRequestResultDashboard({ request, key: payload.key }));
  } catch (e) {
    yield put(setLoading({ key: payload.key, status: false }));
    NotificationManager.error(t('dashboard-settings.error.save-config'), t('error'));
    console.error('[dashboard-settings/ doSaveSettingsRequest saga] error', e);
  }
}

function* doResetConfigToDefault({ api }, { payload }) {
  const { key, recordRef } = payload;

  try {
    const identification = yield select(selectIdentificationForSet, key);
    const isRemoved = yield call(api.dashboard.removeDashboard, { id: identification.id, recordRef });

    if (isRemoved) {
      yield put(getDashboardConfig({ recordRef, key }));
      yield put(setRequestResultDashboard({ request: { status: RequestStatuses.RESET }, key }));
      NotificationManager.success(t('dashboard-settings.success.reset-config'), t('success'));
    }
  } catch (e) {
    yield put(setLoading({ key, status: false }));
    NotificationManager.error(t('dashboard-settings.error.reset-config'), t('error'));
    console.error('[dashboard-settings/ doGetDashboardKeys saga] error', e);
  }
}

function* saga(ea) {
  yield takeEvery(initDashboardSettings().type, doInitDashboardSettingsRequest, ea);
  yield takeEvery(getDashboardConfig().type, doGetDashboardConfigRequest, ea);
  yield takeEvery(getAvailableWidgets().type, doGetWidgetsRequest, ea);
  yield takeEvery(saveDashboardConfig().type, doSaveSettingsRequest, ea);
  yield takeEvery(getDashboardKeys().type, doGetDashboardKeys, ea);
  yield takeEvery(getCheckUpdatedDashboardConfig().type, doCheckUpdatedSettings, ea);
  yield takeEvery(resetConfigToDefault().type, doResetConfigToDefault, ea);
}

export default saga;
