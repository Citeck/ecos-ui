import { put, takeLatest, call } from 'redux-saga/effects';
import { fetchCreateCaseWidgetData, setCreateCaseWidgetItems, setCreateCaseWidgetIsCascade } from '../actions/header';
import { processCreateVariantsItems } from '../misc/menu';

export function* fetchCreateCaseWidget({ api }) {
  try {
    const resp = yield call(api.menu.getCreateVariantsForAllSites);
    const createVariants = processCreateVariantsItems(resp);

    yield put(setCreateCaseWidgetItems(createVariants));

    // TODO get isCascade use api
    yield put(setCreateCaseWidgetIsCascade(true));
  } catch (e) {
    // TODO use logplease
    console.log('[fetchCreateCaseWidgetItemsRequest saga] ' + e.message);
    // yield put(validateUserFailure());
  }
}

function* headerSaga(ea) {
  yield takeLatest(fetchCreateCaseWidgetData().type, fetchCreateCaseWidget, ea);
}

export default headerSaga;
