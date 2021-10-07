import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import get from 'lodash/get';

import CommonBar from '../CommonBar';
import { applyFilter, reloadBoardData, resetFilter, runSearchCard } from '../../../actions/kanban';
import { selectKanbanJournalProps } from '../../../selectors/journals';
import { selectKanban } from '../../../selectors/kanban';
import { getSearchParams } from '../../../helpers/urls';
import { JournalUrlParams } from '../../../constants';
import { Labels } from '../constants';

function mapStateToProps(state, props) {
  const journalProps = selectKanbanJournalProps(state, props.stateId);
  const kanbanProps = selectKanban(state, props.stateId);
  const search = get(getSearchParams(), [JournalUrlParams.SEARCH]);

  return {
    ...journalProps,
    grid: { ...journalProps.grid, search },
    isFilterOn: kanbanProps.isFiltered || journalProps.isFilterOn,
    isLoading: kanbanProps.isLoading,
    noPagination: true,
    noCreateBtn: true,
    settingsColumnsData: null,
    settingsGroupingData: null,
    nameBtnSettings: Labels.Kanban.BTN_SETTINGS
  };
}

function mapDispatchToProps(dispatch, props) {
  const stateId = props.stateId;

  return {
    applySettings: ({ settings }) => dispatch(applyFilter({ settings, stateId })),
    resetFiltering: () => dispatch(resetFilter({ stateId })),
    runSearch: text => dispatch(runSearchCard({ text, stateId })),
    reloadGrid: debounce(() => dispatch(reloadBoardData({ stateId })), 300),
    clearSearch: _ => _
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CommonBar);
