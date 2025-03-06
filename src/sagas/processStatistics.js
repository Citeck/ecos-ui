import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import get from 'lodash/get';

import {
  filterHeatdata,
  filterJournal,
  getJournal,
  getModel,
  setJournal,
  setModel,
  setNewData,
  changeFilter,
  setFilters,
  changePagination,
  setPagination,
  resetFilter,
} from '../actions/processStatistics';
import JournalsService from '../components/Journals/service/journalsService';
import JournalsConverter from '../dto/journals';
import { PREDICATE_EQ } from '../components/Records/predicates/predicates';
import { DEFAULT_PAGINATION } from '../components/Journals/constants';
import { Predicate } from '../components/Filters/predicates';

const getSettings = ({ pagination, predicates, record }) => {
  return JournalsConverter.getSettingsForDataLoaderServer({
    predicate: { att: 'procDefRef', val: record, t: PREDICATE_EQ },
    predicates,
    pagination,
  });
};

const getPredicates = (filters) => {
  if (!filters) return [];

  return JournalsConverter.cleanUpPredicate(
    filters.map(({ att, t, val }) => {
      return new Predicate({ att, t, val });
    }),
  );
};

function* sagaGetJournal({ api }, { payload }) {
  const { record, stateId, pagination, selectedJournal } = payload;

  const { filters } = yield select((state) => state.processStatistics[stateId]);

  const predicates = getPredicates(filters);

  try {
    const journalConfig = yield call([JournalsService, JournalsService.getJournalConfig], selectedJournal, true);
    const res = yield call(
      [JournalsService, JournalsService.getJournalData],
      journalConfig,
      getSettings({ pagination, record, predicates }),
    );

    yield put(setJournal({ stateId, data: res.records, journalConfig, totalCount: res.totalCount }));
  } catch (e) {
    yield put(setJournal({ stateId, data: [], journalConfig: null }));
    console.error('[processStatistics/sagaGetJournal] error', e);
  }
}

function* sagaFilterJournal({ api }, { payload }) {
  const { record, stateId } = payload;

  const { filters, pagination } = yield select((state) => state.processStatistics[stateId]);

  const predicates = getPredicates(filters);

  try {
    yield put(filterHeatdata({ record, stateId, predicates }));

    const journalConfig = yield select((state) => state.processStatistics[stateId].journalConfig);
    const res = yield call(
      [JournalsService, JournalsService.getJournalData],
      journalConfig,
      getSettings({ pagination, record, predicates }),
    );

    yield put(setJournal({ stateId, data: res.records, totalCount: res.totalCount }));
  } catch (e) {
    yield put(setJournal({ stateId, data: [], journalConfig: null }));
    console.error('[processStatistics/sagaFilterJournal] error', e);
  }
}

function* sagaGetModel({ api }, { payload }) {
  const { record, stateId } = payload;

  try {
    const { filters } = yield select((state) => state.processStatistics[stateId]);
    const predicates = getPredicates(filters);

    const model = yield call(api.process.getModel, record);
    const heatmapData = yield call(api.process.getHeatmapData, record, predicates);
    const KPIData = yield call(api.process.getKPIData, record);

    window.Citeck.KPIData = KPIData;

    yield put(setModel({ stateId, model, heatmapData, KPIData }));
    yield put(setNewData({ stateId, isNewData: true }));
  } catch (e) {
    yield put(setModel({ stateId, model: null, heatmapData: [], KPIData: [] }));
    console.error('[processStatistics/sagaGetModel] error', e);
  }
}

function* sagaFilterHeatdata({ api }, { payload }) {
  const { record, stateId, predicates } = payload;

  try {
    const heatmapData = yield call(api.process.getHeatmapData, record, predicates);
    const KPIData = yield call(api.process.getKPIData, record);
    yield put(setModel({ stateId, heatmapData, KPIData }));
    yield put(setNewData({ stateId, isNewData: true }));
  } catch (e) {
    yield put(setModel({ stateId, heatmapData: [] }));
    yield put(setNewData({ stateId, isNewData: true }));
    console.error('[processStatistics/sagaFilterHeatdata] error', e);
  }
}

function* sagaChangeFilter({ api }, { payload }) {
  const { stateId, data = [], record } = payload;

  try {
    const filters = yield select((state) => state.processStatistics[stateId].filters);

    const newFilter = get(data, '0') || {};

    let foundIndex;

    if (newFilter.att) {
      foundIndex = filters.findIndex((item) => item.att === newFilter.att);
    } else {
      foundIndex = filters.findIndex((item) => item.t === newFilter.t);
    }

    const newFilters = [...filters];

    if (foundIndex === -1) {
      newFilters.push(newFilter);
    } else {
      newFilters[foundIndex] = newFilter;
    }

    yield put(setFilters({ stateId, filters: newFilters.filter((item) => !!item.t) }));
    yield put(setPagination({ stateId, pagination: DEFAULT_PAGINATION }));
    yield put(filterJournal({ stateId, record }));
  } catch (e) {
    yield put(setFilters({ stateId, filters: [] }));
    console.error('[processStatistics/sagaChangeFilter] error', e);
  }
}

function* sagaChangePagination({ api }, { payload }) {
  const { stateId, page, maxItems, record } = payload;

  try {
    const pagination = yield select((state) => state.processStatistics[stateId].pagination);

    const newPagination = {
      ...pagination,
      page,
      maxItems,
      skipCount: (page - 1) * maxItems,
    };

    yield put(setPagination({ stateId, pagination: newPagination }));
    yield put(filterJournal({ stateId, record }));
  } catch (e) {
    yield put(setPagination({ stateId, pagination: DEFAULT_PAGINATION }));
    console.error('[processStatistics/sagaChangePagination] error', e);
  }
}

function* sagaResetFilter({ api }, { payload }) {
  const { stateId, record } = payload;

  const filters = yield select((state) => state.processStatistics[stateId].filters);

  // remove all filters except the completed and active checkboxes
  const clearFilters = filters.filter((predicate) => predicate.t === 'or');

  yield put(setFilters({ stateId, filters: clearFilters }));
  yield put(setPagination({ stateId, pagination: DEFAULT_PAGINATION }));
  yield put(filterJournal({ stateId, record }));
}
function* eventsHistorySaga(ea) {
  yield takeEvery(getModel().type, sagaGetModel, ea);
  yield takeEvery(getJournal().type, sagaGetJournal, ea);
  yield takeLatest(filterJournal().type, sagaFilterJournal, ea);
  yield takeEvery(filterHeatdata().type, sagaFilterHeatdata, ea);
  yield takeEvery(changeFilter().type, sagaChangeFilter, ea);
  yield takeEvery(changePagination().type, sagaChangePagination, ea);
  yield takeEvery(resetFilter().type, sagaResetFilter, ea);
}

export default eventsHistorySaga;
