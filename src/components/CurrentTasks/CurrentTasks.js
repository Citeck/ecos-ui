import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getCurrentTaskList } from '../../actions/tasks';
import { selectDataCurrentTasksByStateId } from '../../selectors/tasks';
import CurrentTaskList from './CurrentTaskList';
import './style.scss';

const mapStateToProps = (state, context) => {
  const currentTasksState = selectDataCurrentTasksByStateId(state, context.stateId) || {};

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
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    isSmallMode: false
  };

  componentDidMount() {
    this.getCurrentTaskList();
  }

  getCurrentTaskList = () => {
    const { getCurrentTaskList, stateId, record } = this.props;

    getCurrentTaskList({
      stateId,
      document: record
    });
  };

  render() {
    const { currentTasks, height, isLoading, isSmallMode, className } = this.props;
    const childProps = {
      currentTasks,
      className,
      height,
      isLoading,
      isSmallMode
    };

    return <CurrentTaskList {...childProps} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CurrentTasks);
