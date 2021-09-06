import { connect } from 'react-redux';
import CommonBar from '../CommonBar';
import { applyFilter } from '../../../actions/kanban';
import { selectKanbanJournalProps } from '../../../selectors/journals';

function mapStateToProps(state, props) {
  const ownProps = selectKanbanJournalProps(state, props.stateId);
  return {
    ...ownProps,
    noPagination: true,
    noCreateBtn: true,
    settingsColumnsData: null,
    settingsGroupingData: null
  };
}

function mapDispatchToProps(dispatch, props) {
  const stateId = props.stateId;

  return {
    applySettings: ({ settings }) => dispatch(applyFilter({ settings, stateId })),
    resetFiltering: (...data) => {
      console.log({ data });
    },
    reloadGrid: (...data) => {
      console.log({ data });
    },
    clearSearch: (...data) => {
      console.log({ data });
    },
    runSearch: (...data) => {
      console.log({ data });
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CommonBar);
