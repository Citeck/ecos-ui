import { call, put, select, takeEvery } from 'redux-saga/effects';
import { NotificationManager } from 'react-notifications';

import { createDocument, editDocument, getSettings, recreateDocument, setError, setSettings } from '../actions/docConstructor';
import { t } from '../helpers/util';
import PageService from '../services/PageService';
import Records from '../components/Records';

const DocumentTypes = {
  CONTRACT: 'contract',
  ATTORNEY: 'attorney'
};

function* fetchGetSettings({ api, logger }, { payload: { stateId, record } }) {
  try {
    const settings = {};
    let docProps = {};
    const name = 'doc.one.base.url';
    const response = yield call(api.docConstructor.getSettings, { name });
    //todo wait normal json
    const data = JSON.parse(response.replace('data:', '"data":')).data;

    if (data && data[name]) {
      settings.docOneUrl = data[name] + '/document/';
      docProps = yield call(api.docConstructor.getRecordInfo, record);
      yield put(setSettings({ stateId, settings: { ...settings, ...docProps } }));
    } else {
      yield put(setError({ stateId, error: t('doc-constructor-widget.error.no-doc.one.base.url') }));
    }
  } catch (e) {
    yield put(setError({ stateId, error: t('doc-constructor-widget.error.get-settings') }));
    logger.error('[docConstructor/fetchGetSettings saga] error', e.message);
  }
}

function* runCreateDocument({ api, logger }, { payload: { stateId, record, templateRef } }) {
  try {
    const data = yield select(state => state.docConstructor[stateId]);

    yield call(api.docConstructor.setContractTemplate, { record, templateRef });
    const result = yield call(api.docConstructor.createDocumentByeDocOne, { record });
    yield call(api.docConstructor.setPermissionForRole, { record, options: { role: 'initiator', permission: 'Consumer' } });

    NotificationManager.success('doc-constructor-widget.success.create-doc-one-file-by-node-with-template', 'success');
    PageService.changeUrlLink(data.docOneUrl + result, { openNewBrowserTab: true });
    yield put(getSettings({ stateId, record }));
    Records.get(record).update();
  } catch (e) {
    yield put(setError({ stateId, error: t(e.message) }));
    logger.error('[docConstructor/runCreateDocument saga] error', e.message);
  }
}

function* runRecreateDocument({ api, logger }, { payload: { stateId, record, templateRef } }) {
  try {
    const data = yield select(state => state.docConstructor[stateId]);
    //todo удалить
    yield put(createDocument({ stateId, record, templateRef }));
  } catch (e) {
    yield put(setError({ stateId, error: t(e.message) }));
    logger.error('[docConstructor/runRecreateDocument saga] error', e.message);
  }
}

function* runEditDocument({ api, logger }, { payload: { stateId, record, templateRef } }) {
  try {
    const data = yield select(state => state.docConstructor[stateId]);

    //PageService.changeUrlLink(data.docOneUrl + result, { openNewBrowserTab: true });
  } catch (e) {
    yield put(setError({ stateId, error: t(e.message) }));
    logger.error('[docConstructor/runCreateDocument saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSettings().type, fetchGetSettings, ea);
  yield takeEvery(createDocument().type, runCreateDocument, ea);
  yield takeEvery(recreateDocument().type, runRecreateDocument, ea);
  yield takeEvery(editDocument().type, runEditDocument, ea);
}

export default saga;
