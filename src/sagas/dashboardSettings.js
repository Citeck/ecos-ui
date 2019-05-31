import { delay } from 'redux-saga';
import { put, takeLatest } from 'redux-saga/effects';
import {
  getConfigPage,
  getMenuItems,
  getWidgets,
  saveConfigPage,
  setConfigPage,
  setMenuItems,
  setStatusSaveConfigPage,
  setWidgets
} from '../actions/dashboardSettings';

import * as mock from '../api/mock/dashboardSettings';

function* doGetConfigPageRequest({ api, logger }, action) {
  try {
    yield delay(1000);
    yield put(setConfigPage(mock.getConfigPage()));
  } catch (e) {
    logger.error('[dashboard/settings doGetConfigPageRequest saga] error', e.message);
  }
}

function* doGetWidgetsRequest({ api, logger }, action) {
  try {
    yield delay(1000);
    yield put(setWidgets(mock.getWidgets(20)));
  } catch (e) {
    logger.error('[dashboard/settings doGetWidgetsRequest saga] error', e.message);
  }
}

function* doGetMenuItemsRequest({ api, logger }, action) {
  try {
    yield delay(1000);
    yield put(setMenuItems(mock.getMenuItems()));
  } catch (e) {
    logger.error('[dashboard/settings doGetMenuItemsRequest saga] error', e.message);
  }
}

function* doSaveConfigLayoutRequest({ api, logger }, action) {
  try {
    yield delay(1000);
    yield put(setStatusSaveConfigPage({}));
  } catch (e) {
    logger.error('[dashboard/settings doSaveConfigLayoutRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getConfigPage().type, doGetConfigPageRequest, ea);
  yield takeLatest(getWidgets().type, doGetWidgetsRequest, ea);
  yield takeLatest(getMenuItems().type, doGetMenuItemsRequest, ea);
  yield takeLatest(saveConfigPage().type, doSaveConfigLayoutRequest, ea);
}

export default saga;
