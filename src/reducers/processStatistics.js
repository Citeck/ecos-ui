import { handleActions } from 'redux-actions';
import pick from 'lodash/pick';

import { deleteStateById, startLoading, updateState } from '../helpers/redux';
import {
  filterHeatdata,
  filterJournal,
  getJournal,
  getModel,
  resetDashlet,
  setJournal,
  setModel,
  setNewData,
  setFilters,
  setPagination
} from '../actions/processStatistics';
import { DEFAULT_PAGINATION } from '@/components/journals/Journals/constants';

const initialState = {
  isLoadingJournal: false,
  isLoadingModel: false,
  isLoadingHeatmap: false,
  data: [],
  totalCount: 0,
  journalConfig: null,
  model: null,
  sectionPath: '',
  heatmapData: null,
  KPIData: [],
  isNewData: false,
  filters: [],
  pagination: DEFAULT_PAGINATION
};

export default handleActions(
  {
    [getModel]: (state, action) =>
      startLoading(initialState, 'isLoadingHeatmap')(startLoading(initialState, 'isLoadingModel')(state, action), action),
    // statistics reload keeps the already rendered model on screen, only the heatmap loader is shown
    [filterHeatdata]: startLoading(initialState, 'isLoadingHeatmap'),
    [getJournal]: startLoading(initialState, 'isLoadingJournal'),
    [filterJournal]: startLoading(initialState, 'isLoadingJournal'),
    [setModel]: (state, { payload }) =>
      updateState(state, payload.stateId, {
        ...pick(payload, 'model', 'heatmapData', 'KPIData'),
        isLoadingModel: false,
        ...('heatmapData' in payload ? { isLoadingHeatmap: false } : {})
      }),
    [setJournal]: (state, { payload }) =>
      updateState(state, payload.stateId, { ...pick(payload, 'data', 'journalConfig', 'totalCount'), isLoadingJournal: false }),
    [setNewData]: (state, { payload }) => updateState(state, payload.stateId, { stateId: payload.stateId, isNewData: payload.isNewData }),
    [resetDashlet]: (state, { payload: { stateId } }) => deleteStateById(state, stateId),
    [setFilters]: (state, { payload }) => updateState(state, payload.stateId, { ...pick(payload, 'filters') }),
    [setPagination]: (state, { payload }) => updateState(state, payload.stateId, { ...pick(payload, 'pagination') })
  },
  {}
);
