import { NotificationManager } from 'react-notifications';
import { call, put, takeLatest } from 'redux-saga/effects';

import { getMenuConfig, initMenuConfig, saveMenuConfig, setMenuConfig, setRequestResultMenuConfig } from '../actions/menu';
import { t } from '../helpers/util';
import { RequestStatuses } from '../constants';
import MenuConverter from '../dto/menu';

function* doInitMenu({ api, logger }, action) {
  try {
    yield put(getMenuConfig());
  } catch (e) {
    logger.error('[menu/ doInitMenu] error', e.message);
  }
}

function* doGetMenuConfigRequest({ api, logger }) {
  try {
    const result1 = yield call(api.menu.getMenuConfig, true);
    const result2 = yield call(api.menu.getUserMenuConfig);
    const menu = MenuConverter.parseGetResult({ ...result1, ...result2 });

    yield put(setMenuConfig(menu));
  } catch (e) {
    NotificationManager.error(t('menu.error.get-config'), t('error'));
    logger.error('[menu/ doGetMenuConfigRequest] error', e.message);
  }
}

function* doSaveMenuConfigRequest({ api, logger }, { payload }) {
  try {
    const config = MenuConverter.getSettingsConfigForServer(payload);

    yield call(api.menu.saveMenuConfig, { config });
    yield put(setMenuConfig(payload));
    yield put(setRequestResultMenuConfig({ status: RequestStatuses.SUCCESS }));
  } catch (e) {
    NotificationManager.error(t('menu.error.save-config'), t('error'));
    logger.error('[menu/ doSaveMenuConfigRequest] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initMenuConfig().type, doInitMenu, ea);
  yield takeLatest(getMenuConfig().type, doGetMenuConfigRequest, ea);
  yield takeLatest(saveMenuConfig().type, doSaveMenuConfigRequest, ea);
}

export default saga;
