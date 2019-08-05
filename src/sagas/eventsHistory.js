import { call, put, takeEvery } from 'redux-saga/effects';
import { getEventsHistory, setEventsHistory } from '../actions/eventsHistory';
import { t } from '../helpers/util';

function* sagaGetEventsHistory({ api, logger }, { payload }) {
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
    const res = yield call(api.eventsHistory.getEventsHistory, { record, columns });

    yield put(setEventsHistory({ stateId, list: res.data || [], columns: res.columns || [] }));
  } catch (e) {
    yield put(setEventsHistory({ stateId, list: [], columns: [] }));
    logger.error('[tasks/sagaGetEventsHistory saga] error', e.message);
  }
}

function* eventsHistorySaga(ea) {
  yield takeEvery(getEventsHistory().type, sagaGetEventsHistory, ea);
}

export default eventsHistorySaga;
