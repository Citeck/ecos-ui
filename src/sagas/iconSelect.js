import { NotificationManager } from 'react-notifications';
import { put, select, takeLatest } from 'redux-saga/effects';

import { deleteCustomIcon, getCustomIcons, getFontIcons, setCustomIcons, setFontIcons, uploadCustomIcon } from '../actions/iconSelect';
import { t } from '../helpers/util';
import MenuConverter from '../dto/menu';

function* fetchGetCustomIcons({ api, logger }, { payload }) {
  try {
    //todo wait api
    const testIcons = ['ui/icon@icon-question', 'ui/icon@icon-User_avatar'];

    yield put(setCustomIcons(testIcons.map(icon => MenuConverter.getIconObjectWeb(icon))));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.get-custom-icons'), t('error'));
    logger.error('[menu-settings / fetchGetCustomIcons]', e.message);
  }
}

function* fetchGetFontIcons({ api, logger }, { payload: prefix }) {
  try {
    const icons = yield import('../fonts/citeck/config.json')
      .then(module => (module.glyphs || []).map(item => ({ value: `icon-${item.css}`, type: 'icon' })))
      .then(icons => {
        if (prefix) {
          return icons.filter(item => item.value.startsWith(prefix));
        }

        return icons;
      });

    yield put(setFontIcons(icons));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.get-custom-icons'), t('error'));
    logger.error('[menu-settings / fetchGetFontIcons]', e.message);
  }
}

function* runUploadCustomIcon({ api, logger }, { payload: file }) {
  try {
    const customIcons = yield select(state => state.iconSelect.customIcons);

    customIcons.forEach(icon => (icon.lastLoaded = false));

    //todo api upload
    const newIcon = { value: 'icon-empty-icon', lastLoaded: true };

    yield put(setCustomIcons([...customIcons, newIcon]));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.get-custom-icons'), t('error'));
    logger.error('[menu-settings / runUploadCustomIcon]', e.message);
  }
}

function* runDeleteCustomIcon({ api, logger }, { payload: deleted }) {
  try {
    const customIcons = yield select(state => state.iconSelect.customIcons);

    //todo api delete

    const filtered = customIcons.filter(icon => icon.value !== deleted.value);

    yield put(setCustomIcons([...filtered]));
  } catch (e) {
    NotificationManager.error(t('menu-settings.error.get-custom-icons'), t('error'));
    logger.error('[menu-settings / runDeleteCustomIcon]', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getCustomIcons().type, fetchGetCustomIcons, ea);
  yield takeLatest(getFontIcons().type, fetchGetFontIcons, ea);
  yield takeLatest(uploadCustomIcon().type, runUploadCustomIcon, ea);
  yield takeLatest(deleteCustomIcon().type, runDeleteCustomIcon, ea);
}

export default saga;
