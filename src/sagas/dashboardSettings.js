import { delay } from 'redux-saga';
import { select, put, takeLatest, call } from 'redux-saga/effects';
import {
  getLayouts,
  getWidgets,
  getMenuItems,
  getConfigLayout,
  saveConfigLayout,
  getLayoutsRequest,
  getWidgetsRequest,
  getMenuItemsRequest,
  getConfigLayoutRequest,
  saveConfigLayoutRequest
} from '../actions/dashboardSettings';

import * as mock from '../api/mock/dashboardSettings';

function* doGetLayoutsRequest({ api, logger }) {
  try {
    yield delay(1000);
    yield put(getWidgets(mock.getWidgets()));
  } catch (e) {
    logger.error('[bpmn doGetLayoutsRequest saga] error', e.message);
  }
}

function* doGetWidgetsRequest({ api, logger }, action) {
  try {
    yield delay(1000);
    yield put(getLayouts(mock.getLayouts()));
  } catch (e) {
    logger.error('[bpmn doGetWidgetsRequest saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeLatest(getLayoutsRequest().type, doGetLayoutsRequest, ea);
  yield takeLatest(getWidgetsRequest().type, doGetWidgetsRequest, ea);
  // yield takeLatest(getMenuItemsRequest().type, doDeleteCategoryRequest, ea);
  // yield takeLatest(getConfigLayoutRequest().type, doSaveProcessModelRequest, ea);
  // yield takeLatest(saveConfigLayoutRequest().type, doImportProcessModelRequest, ea);
}

export default saga;
