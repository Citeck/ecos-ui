import { NotificationManager } from 'react-notifications';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import {
  getCustomIcons,
  getSettingsConfig,
  initSettings,
  saveSettingsConfig,
  setCustomIcons,
  setSettingsConfig
} from '../actions/menuSettings';
import { t } from '../helpers/util';
import MenuSettingsService from '../services/MenuSettingsService';
import MenuConverter from '../dto/menu';

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
    console.log(result);
    const type = yield select(state => state.menu.type);
    const config = MenuConverter.getSettingsConfigWeb(result, { type });
    console.log(config);
    yield put(setSettingsConfig(config));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.get-config'), t('error'));
    logger.error('[menu-settings / fetchGetSettingsConfig]', e.message);
  }
}

function* runSaveSettingsConfig({ api, logger }, { payload }) {
  try {
    const id = yield select(state => state.menuSettings.id);
    const subMenu = payload;
    const result = yield call(api.menu.saveMenuSettingsConfig, { id, subMenu });
    console.log(result);
    yield put(setSettingsConfig(payload));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.save-config'), t('error'));
    logger.error('[menu-settings / runSaveSettingsConfig]', e.message);
  }
}

function* fetchGetCustomIcons({ api, logger }, { payload }) {
  try {
    yield put(setCustomIcons(MenuSettingsService.testIcons));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.get-custom-icons'), t('error'));
    logger.error('[menu-settings / fetchGetCustomIcons]', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(initSettings().type, runInitSettings, ea);
  yield takeLatest(getSettingsConfig().type, fetchGetSettingsConfig, ea);
  yield takeLatest(saveSettingsConfig().type, runSaveSettingsConfig, ea);
  yield takeLatest(getCustomIcons().type, fetchGetCustomIcons, ea);
}

export default saga;
