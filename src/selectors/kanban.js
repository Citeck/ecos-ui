import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import { createSelector } from 'reselect';

import { DEFAULT_PAGINATION } from '@/components/journals/Journals/constants';
import { initialState } from '../reducers/kanban';

const prefix = 'kanban';

export const selectKanban = (state, key) => get(state, [prefix, key]) || { ...initialState };

export const selectBoardList = createSelector(selectKanban, state => get(state, 'boardList') || []);

export const selectBoardConfig = createSelector(selectKanban, state => get(state, 'boardConfig') || {});

export const selectFormProps = createSelector(selectKanban, state => get(state, 'formProps') || {});

export const selectIsKanbanEnabled = createSelector(selectKanban, state => get(state, 'isEnabled') || false);

export const selectPagination = createSelector(selectKanban, state => cloneDeep(get(state, 'pagination', DEFAULT_PAGINATION)));

export const selectRelatedFilter = createSelector(selectKanban, state => get(state, 'relatedFilter') || null);

export const selectSwimlaneGrouping = createSelector(selectKanban, s => s.swimlaneGrouping);
export const selectSwimlanes = createSelector(selectKanban, s => s.swimlanes || []);

/**
 * Board total in swimlane (grouping) mode.
 *
 * With grouping on there is no `dataCards` and NO saga owns `state.totalCount` — every swimlane saga
 * only writes per-cell counts. Deriving the total here (instead of dispatching setTotalCount from six
 * sagas) keeps the badge sum and the "Total: N" label in sync for EVERY path that touches the cells:
 * first load, filter, search, preset, DnD, "show more", card refresh and silent refresh.
 *
 * Column scope mirrors the flat path (sagas/kanban.js sagaGetData): count only cells that belong to a
 * column of the board config, so switching modes cannot change the number.
 */
export function computeSwimlanesTotalCount(swimlanes, boardConfig) {
  const columnIds = (get(boardConfig, 'columns') || []).map(col => get(col, 'id')).filter(Boolean);
  const allowed = columnIds.length > 0 ? new Set(columnIds) : null;

  return (swimlanes || []).reduce((total, swimlane) => {
    const cells = get(swimlane, 'cells') || {};

    return (
      total +
      Object.keys(cells).reduce((sum, columnId) => {
        if (allowed && !allowed.has(columnId)) {
          return sum;
        }

        const count = get(cells, [columnId, 'totalCount']);

        return sum + (typeof count === 'number' && count > 0 ? count : 0);
      }, 0)
    );
  }, 0);
}

export const selectKanbanPageProps = createSelector(selectKanban, data => ({
  originKanbanSettings: data.originKanbanSettings,
  kanbanSettings: data.kanbanSettings,
  boardList: data.boardList,
  templateList: data.templateList,
  boardConfig: data.boardConfig,
  isLoading: data.isLoading,
  isEnabled: data.isEnabled,
  totalCount: data.swimlaneGrouping ? computeSwimlanesTotalCount(data.swimlanes, data.boardConfig) : data.totalCount,
  swimlaneGrouping: data.swimlaneGrouping
}));

export const selectKanbanProps = createSelector(selectKanban, data => ({
  originKanbanSettings: data.originKanbanSettings,
  kanbanSettings: data.kanbanSettings,
  columns: get(data, 'boardConfig.columns'),
  formProps: data.formProps,
  dataCards: data.dataCards || [],
  resolvedActions: data.resolvedActions,
  totalCount: data.totalCount,
  isLoading: data.isLoading,
  isRefreshing: data.isRefreshing,
  isFirstLoading: data.isFirstLoading,
  isFiltered: data.isFiltered,
  isLoadingColumns: data.isLoadingColumns || [],
  page: data.pagination.page,
  selectedBoard: get(data, 'boardConfig.name'),
  swimlaneGrouping: data.swimlaneGrouping,
  swimlanes: data.swimlanes || []
}));
