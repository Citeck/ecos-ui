import { connect } from 'react-redux';
import CommonBar from '../CommonBar';
import { applyFilter, resetFilter } from '../../../actions/kanban';
import { selectKanbanJournalProps } from '../../../selectors/journals';
import { selectKanban } from '../../../selectors/kanban';
import { Labels } from '../constants';

function mapStateToProps(state, props) {
  const journalProps = selectKanbanJournalProps(state, props.stateId);
  const kanbanProps = selectKanban(state, props.stateId);

  return {
    ...journalProps,
    isFilterOn: kanbanProps.isFiltered,
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
    reloadGrid: (...data) => {
      console.log(2, { data });
    },
    clearSearch: (...data) => {
      console.log(3, { data });
    },
    runSearch: (...data) => {
      console.log(4, { data });
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CommonBar);
