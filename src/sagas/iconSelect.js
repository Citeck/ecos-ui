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
import { getIconObjectWeb, getIconRef } from '../helpers/icon';
import { t } from '../helpers/util';

import { NotificationManager } from '@/services/notifications';

function* fetchGetCustomIcons({ api }, { payload: { family } }) {
  try {
    const icons = yield call(api.customIcon.getIcons, { family });

    yield put(setCustomIcons(icons.map(icon => getIconObjectWeb(icon))));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('icon-select.error.get-custom-icons'), t('error'));
    console.error('[menu-settings / fetchGetCustomIcons]', e);
  }
}

function* fetchGetFontIcons({ api }, { payload: prefix }) {
  try {
    const common = yield import('../fonts/citeck/config.json');
    const icons = common.glyphs.map(item => ({ value: `icon-${item.css}`, type: 'icon' }));

    yield put(setFontIcons(prefix ? icons.filter(item => item.value.startsWith(prefix)) : icons));
  } catch (e) {
    NotificationManager.error(t('icon-select.error.get-font-icons'), t('error'));
    console.error('[menu-settings / fetchGetFontIcons]', e);
  }
}

function* runUploadCustomIcon({ api }, { payload: { file, family } }) {
  try {
    const customIcons = yield select(state => state.iconSelect.customIcons);

    const type = 'img';
    const { name } = file;
    const nameArr = name.split('.');
    const format = nameArr.pop();
    const filename = nameArr.join('.');

    const data = yield call(api.app.getBase64, file);
    const recordIcon = yield call(api.customIcon.uploadIcon, { data, type, family, config: { filename, format } });
    const uploadedIcon = yield call(api.customIcon.getIconInfo, recordIcon.id);
    const newIcon = { ...uploadedIcon, url: data };

    yield put(setCustomIcons([...customIcons, newIcon]));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('icon-select.error.upload-custom-icon'), t('error'));
    console.error('[menu-settings / runUploadCustomIcon]', e);
  }
}

function* runDeleteCustomIcon({ api }, { payload: deleted }) {
  try {
    const customIcons = yield select(state => state.iconSelect.customIcons);

    yield call(api.customIcon.deleteIcon, [getIconRef(deleted)]);

    const filtered = customIcons.filter(icon => icon.value !== deleted.value);

    yield put(setCustomIcons([...filtered]));
  } catch (e) {
    yield put(setLoading(false));
    NotificationManager.error(t('icon-select.error.delete-custom-icon'), t('error'));
    console.error('[menu-settings / runDeleteCustomIcon]', e);
  }
}

function* saga(ea) {
  yield takeLatest(getCustomIcons().type, fetchGetCustomIcons, ea);
  yield takeLatest(getFontIcons().type, fetchGetFontIcons, ea);
  yield takeLatest(uploadCustomIcon().type, runUploadCustomIcon, ea);
  yield takeLatest(deleteCustomIcon().type, runDeleteCustomIcon, ea);
}

export default saga;
