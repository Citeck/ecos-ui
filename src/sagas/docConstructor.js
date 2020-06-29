import { call, put, select, takeEvery } from 'redux-saga/effects';

import { createDocument, getSettings, setError, setLoadingSync, setSettings } from '../actions/docConstructor';
import { t } from '../helpers/util';
import PageService from '../services/PageService';
import Records from '../components/Records';

const DocumentTypes = {
  CONTRACT: 'contract',
  ATTORNEY: 'attorney'
};

function* fetchGetSettings({ api, logger }, { payload: { stateId, record } }) {
  const settings = {};
  let docProps = {};

  try {
    const name = 'doc.one.base.url';
    const response = yield call(api.docConstructor.getSettings, { name });
    //todo wait normal json
    const data = JSON.parse(response.replace('data:', '"data":')).data;

    if (data && data[name]) {
      settings.url = data[name] + '/document/';
      docProps = yield call(api.docConstructor.getRecordInfo, record);
    } else {
      setError({ stateId, error: t('doc-constructor-widget.error.no-doc.one.base.url') });
    }

    yield put(setSettings({ stateId, data: { ...settings, ...docProps } }));
  } catch (e) {
    yield put(setError({ stateId, error: t('doc-constructor-widget.error.get-settings') }));
    logger.error('[docConstructor/fetchGetSettings saga] error', e.message);
  }
}

function* runCreateDocument({ api, logger }, { payload: { stateId, record, templateRef } }) {
  try {
    const data = yield select(state => state.docConstructor[stateId]);
    const result = yield call(api.docConstructor.createDocumentByeDocOne, {
      record: data.documentType === DocumentTypes.CONTRACT ? templateRef : record,
      options: { role: 'initiator', permission: 'Consumer' }
    });

    Records.get(record).update();
    PageService.changeUrlLink(data.url + result, { openInBackground: true });
    yield put(setLoadingSync({ stateId, isLoadingSync: false }));
  } catch (e) {
    yield put(setError({ stateId, error: t(e.message) }));
    logger.error('[docConstructor/runCreateDocument saga] error', e.message);
  }
}

function* saga(ea) {
  yield takeEvery(getSettings().type, fetchGetSettings, ea);
  yield takeEvery(createDocument().type, runCreateDocument, ea);
}

export default saga;
