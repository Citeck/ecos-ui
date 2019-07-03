import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getCurrentTaskList } from '../../actions/tasks';
import { selectDataCurrentTasksByStateId } from '../../selectors/tasks';
import CurrentTaskList from './CurrentTaskList';
import './style.scss';

const mapStateToProps = (state, context) => {
  const currentTasksState = selectDataCurrentTasksByStateId(state, context.record) || {};

  return {
    currentTasks: currentTasksState.list,
    isLoading: currentTasksState.isLoading
  };
};

const mapDispatchToProps = dispatch => ({
  getCurrentTaskList: payload => dispatch(getCurrentTaskList(payload))
  //changeTaskAssignee: payload => dispatch(changeTaskAssignee(payload))
});

class CurrentTasks extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool
  };

  static defaultProps = {
    record: '',
    className: '',
    isSmallMode: false
  };

  componentDidMount() {
    this.getCurrentTaskList();
  }

  getCurrentTaskList = () => {
    const { getCurrentTaskList, record } = this.props;

    getCurrentTaskList({
      stateId: record,
      document: record
    });
  };

  onAssignClick = ({ taskId, actionOfAssignment, ownerUserName }) => {
    /*const { changeTaskAssignee, record } = this.props;

    changeTaskAssignee({
      actionOfAssignment,
      ownerUserName,
      stateId: record,
      taskId
    });*/
  };

  render() {
    const { currentTasks, height, isLoading, isSmallMode } = this.props;
    const childProps = {
      currentTasks,
      height,
      isLoading,
      isSmallMode,
      onAssignClick: this.onAssignClick
    };

    return <CurrentTaskList {...childProps} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrentTasks);
