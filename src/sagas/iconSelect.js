import { NotificationManager } from 'react-notifications';
import { call, put, select, takeLatest } from 'redux-saga/effects';

import {
  deleteCustomIcon,
  getCustomIcons,
  getFontIcons,
  setCustomIcons,
  setFontIcons,
  setLoading,
  uploadCustomIcon
} from '../actions/iconSelect';
import { t } from '../helpers/util';
import { getIconObjectWeb, getIconRef } from '../helpers/icon';

function* fetchGetCustomIcons({ api, logger }, { payload: { family } }) {
  try {
    const icons = yield call(api.customIcon.getIcons, { family });

    yield put(setCustomIcons(icons.map(icon => getIconObjectWeb(icon))));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('icon-select.error.get-custom-icons'), t('error'));
    logger.error('[menu-settings / fetchGetCustomIcons]', e.message);
  }
}

function* fetchGetFontIcons({ api, logger }, { payload: prefix }) {
  try {
    const icons = yield import('../fonts/citeck/config.json')
      .then(module => (module.glyphs || []).map(item => ({ value: `icon-${item.css}`, type: 'icon' })))
      .then(icons => (prefix ? icons.filter(item => item.value.startsWith(prefix)) : icons));

    yield put(setFontIcons(icons));
  } catch (e) {
    NotificationManager.error(t('icon-select.error.get-font-icons'), t('error'));
    logger.error('[menu-settings / fetchGetFontIcons]', e.message);
  }
}

function* runUploadCustomIcon({ api, logger }, { payload: { file, family } }) {
  try {
    const customIcons = yield select(state => state.iconSelect.customIcons);
    customIcons.forEach(icon => (icon.lastLoaded = false));

    const type = 'img';
    const { name } = file;
    const nameArr = name.split('.');
    const format = nameArr.pop();
    const filename = nameArr.join('.');

    const data = yield call(api.app.getBase64, file);
    const recordIcon = yield call(api.customIcon.uploadIcon, { data, type, family, config: { filename, format } });
    const uploadedIcon = yield call(api.customIcon.getIconInfo, recordIcon.id);
    const newIcon = { ...uploadedIcon, url: data, lastLoaded: true };

    yield put(setCustomIcons([...customIcons, newIcon]));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('icon-select.error.upload-custom-icon'), t('error'));
    logger.error('[menu-settings / runUploadCustomIcon]', e.message);
  }
}

function* runDeleteCustomIcon({ api, logger }, { payload: deleted }) {
  try {
    const customIcons = yield select(state => state.iconSelect.customIcons);

    //todo check api delete
    yield call(api.customIcon.deleteIcon, [getIconRef(deleted)]);

    const filtered = customIcons.filter(icon => icon.value !== deleted.value);

    yield put(setCustomIcons([...filtered]));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('icon-select.error.delete-custom-icon'), t('error'));
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
