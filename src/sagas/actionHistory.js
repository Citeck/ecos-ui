import { call, put, takeEvery } from 'redux-saga/effects';
import { getActionHistory, setActionHistory } from '../actions/actionHistory';
import { t } from '../helpers/util';

function* sagaGetActionHistory({ api, logger }, { payload }) {
  const { record, stateId } = payload;

  try {
    const columns = [
      {
        attribute: 'event:date',
        formatter: 'DateTimeFormatter',
        text: t('dochist.header.date'),
        type: 'date'
      },
      {
        attribute: 'event:name',
        formatter: {
          name: 'FunctionFormatter',
          params: {
            // fn: Citeck.format.message('dochist.')
            //fn: console.log
          }
        },
        text: t('dochist.header.name')
      },
      {
        attribute: 'event:documentVersion',
        text: t('dochist.header.version')
      },
      {
        dataField: 'event:initiator',
        formatter: 'UserNameLinkFormatter',
        text: t('dochist.header.person')
      },
      {
        attribute: 'taskOriginalOwner',
        formatter: 'UserNameLinkFormatter',
        text: t('dochist.header.fromName')
      },
      {
        attribute: 'event:taskRole',
        text: t('dochist.header.group')
      },
      {
        attribute: 'event:taskTitle',
        text: t('dochist.header.task')
      },
      {
        attribute: 'event:taskOutcomeTitle',
        text: t('dochist.header.outcome')
      },
      {
        attribute: 'event:taskComment',
        text: t('dochist.header.comment'),
        width: 230
      }
    ];
    const res = yield call(api.actionHistory.getActionHistory, { record, columns });

    yield put(setActionHistory({ stateId, list: res.data || [], columns: res.columns || [] }));
  } catch (e) {
    yield put(setActionHistory({ stateId, list: [], columns: [] }));
    logger.error('[tasks/sagaGetActionHistory saga] error', e.message);
  }
}

function* actionHistorySaga(ea) {
  yield takeEvery(getActionHistory().type, sagaGetActionHistory, ea);
}

export default actionHistorySaga;
