import { NotificationManager } from 'react-notifications';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import set from 'lodash/set';

import {
  addJournalMenuItems,
  getCustomIcons,
  getSettingsConfig,
  initSettings,
  saveSettingsConfig,
  setCustomIcons,
  setMenuItems,
  setOpenMenuSettings,
  setSettingsConfig
} from '../actions/menuSettings';
import { t } from '../helpers/util';
import MenuConverter from '../dto/menu';
import MenuSettingsService from '../services/MenuSettingsService';
import { MenuSettings as ms } from '../constants/menu';

function* runInitSettings({ api, logger }, action) {
  try {
    yield put(getSettingsConfig());
    yield put(getCustomIcons());
  } catch (e) {
    logger.error('[menu-settings / runInitSettings]', e.message);
  }
}

function* fetchGetSettingsConfig({ api, logger }) {
  try {
    const result = yield call(api.menu.getMenuSettingsConfig, { id: 'test-custom-menu' }); //todo id
    const type = yield select(state => state.menu.type);
    const config = MenuConverter.getSettingsConfigWeb(result, { type });

    yield put(setSettingsConfig(config));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.get-config'), t('error'));
    logger.error('[menu-settings / fetchGetSettingsConfig]', e.message);
  }
}

function* runSaveSettingsConfig({ api, logger }, { payload }) {
  try {
    const type = yield select(state => state.menu.type);
    const id = yield select(state => state.menuSettings.id);
    const items = yield select(state => state.menuSettings.items);

    const result = yield call(api.menu.getMenuSettingsConfig, { id });
    const originalItems = set(result, ['subMenu', type.toLowerCase(), 'items'], []);
    const serverData = MenuConverter.getSettingsConfigServer({ originalItems, items });

    set(result, ['subMenu', type.toLowerCase()], serverData);

    yield call(api.menu.saveMenuSettingsConfig, { id, subMenu: result.subMenu });
    yield put(setOpenMenuSettings(false));
    NotificationManager.success(t('menu-settings.success.save-config'), t('success'));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.save-config'), t('error'));
    logger.error('[menu-settings / runSaveSettingsConfig]', e.message);
  }
}

function* fetchGetCustomIcons({ api, logger }, { payload }) {
  try {
    yield put(setCustomIcons([])); //todo wait api
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.get-custom-icons'), t('error'));
    logger.error('[menu-settings / fetchGetCustomIcons]', e.message);
  }
}

function* runAddJournalMenuItems({ api, logger }, { payload }) {
  try {
    const { records, id, type } = payload;
    const items = yield select(state => state.menuSettings.items);
    const data = yield call(api.menu.getJournalItemInfo, records);

    data.forEach(item => (item.type = type));

    yield put(setMenuItems(MenuSettingsService.processAction({ action: ms.ActionTypes.EDIT, items, id, data })));
  } catch (e) {
    NotificationManager.warning('', t('error'));
    logger.error('[menu-settings / fetchGetCustomIcons]', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSettings().type, runInitSettings, ea);
  yield takeLatest(getSettingsConfig().type, fetchGetSettingsConfig, ea);
  yield takeLatest(saveSettingsConfig().type, runSaveSettingsConfig, ea);
  yield takeLatest(getCustomIcons().type, fetchGetCustomIcons, ea);
  yield takeLatest(addJournalMenuItems().type, runAddJournalMenuItems, ea);
}

export default saga;
