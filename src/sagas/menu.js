import { NotificationManager } from '@/services/notifications';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { t } from '../helpers/util';
import { RequestStatuses } from '../constants';
import MenuConverter from '../dto/menu';
import { getMenuConfig, saveMenuConfig, setMenuConfig, setRequestResultMenuConfig } from '../actions/menu';

function* doGetMenuConfigRequest({ api }) {
  try {
    const result2 = yield call(api.menu.getUserMenuConfig);
    const menu = MenuConverter.parseGetResult({ ...result2 });

    yield put(setMenuConfig(menu));
  } catch (e) {
    NotificationManager.error(t('menu.error.get-config'), t('error'));
    console.error('[menu/ doGetMenuConfigRequest] error', e);
  }
}

function* doSaveMenuConfigRequest({ api }, { payload }) {
  try {
    const curSet = yield select((state) => state.menu);
    const config = MenuConverter.getSettingsConfigForServer(payload);

    yield call(api.menu.saveMenuConfig, { config });
    yield put(setMenuConfig({ ...curSet, ...payload }));
    yield put(setRequestResultMenuConfig({ status: RequestStatuses.SUCCESS }));
  } catch (e) {
    NotificationManager.error(t('menu.error.save-config'), t('error'));
    console.error('[menu/ doSaveMenuConfigRequest] error', e);
  }
}

function* saga(ea) {
  yield takeLatest(getMenuConfig().type, doGetMenuConfigRequest, ea);
  yield takeLatest(saveMenuConfig().type, doSaveMenuConfigRequest, ea);
}

export default saga;
