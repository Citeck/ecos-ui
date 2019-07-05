import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeTaskAssignee, getTaskList } from '../../actions/tasks';
import { selectDataTasksByStateId } from '../../selectors/tasks';
import TaskList from './TaskList';
import './style.scss';

const mapStateToProps = (state, context) => {
  const currentTaskList = selectDataTasksByStateId(state, context.stateId) || {};

  return {
    tasks: currentTaskList.list,
    isLoading: currentTaskList.isLoading
  };
};

const mapDispatchToProps = dispatch => ({
  getTaskList: payload => dispatch(getTaskList(payload)),
  changeTaskAssignee: payload => dispatch(changeTaskAssignee(payload))
});

class Tasks extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isRunReload: PropTypes.bool,
    setReloadDone: PropTypes.func
  };

  static defaultProps = {
    className: '',
    isSmallMode: false,
    isRunReload: false,
    setReloadDone: () => {}
  };

  componentDidMount() {
    this.getTaskList();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.isRunReload) {
      this.getTaskList();
      this.props.setReloadDone(true);
    }
  }

  getTaskList = () => {
    const { getTaskList, record, stateId } = this.props;

    getTaskList({
      stateId,
      document: record
    });
  };

  onAssignClick = ({ taskId, actionOfAssignment, ownerUserName }) => {
    const { changeTaskAssignee, stateId } = this.props;

    changeTaskAssignee({
      actionOfAssignment,
      ownerUserName,
      stateId,
      taskId
    });
  };

  onSubmitForm = () => {
    this.getTaskList();
  };

  render() {
    const { tasks, height, isLoading, isSmallMode } = this.props;
    const childProps = {
      tasks,
      height,
      isLoading,
      isSmallMode,
      onAssignClick: this.onAssignClick,
      onSubmitForm: this.onSubmitForm
    };

    return <TaskList {...childProps} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks);
