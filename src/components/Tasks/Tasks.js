import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { isEmpty } from 'lodash';
import { changeTaskAssignee, getTaskList, resetTaskList } from '../../actions/tasks';
import { updateRequestDocStatus } from '../../actions/docStatus';
import { updateRequestCurrentTasks } from '../../actions/currentTasks';
import { selectStateTasksById } from '../../selectors/tasks';
import { DefineHeight } from '../common';
import TaskList from './TaskList';

import './style.scss';

const mapStateToProps = (state, context) => {
  const tasksState = selectStateTasksById(state, context.stateId) || {};

  return {
    tasks: tasksState.list,
    isLoading: tasksState.isLoading,
    totalCount: tasksState.totalCount,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = dispatch => ({
  getTaskList: payload => dispatch(getTaskList(payload)),
  changeTaskAssignee: payload => dispatch(changeTaskAssignee(payload)),
  updateRequestDocStatus: payload => dispatch(updateRequestDocStatus(payload)),
  updateRequestCurrentTasks: payload => dispatch(updateRequestCurrentTasks(payload)),
  resetTaskList: payload => dispatch(resetTaskList(payload))
});

class Tasks extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isRunReload: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setReloadDone: PropTypes.func,
    setInfo: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.elementType })])
  };

  static defaultProps = {
    className: '',
    isSmallMode: false,
    isRunReload: false
  };

  state = {
    contentHeight: 0
  };

  listRef = React.createRef();

  componentDidMount() {
    this.getTaskList();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.isRunReload) {
      this.getTaskList();
      this.props.setReloadDone && this.props.setReloadDone(true);
    }

    if (this.props.totalCount !== nextProps.totalCount) {
      this.props.setInfo && this.props.setInfo({ totalCount: nextProps.totalCount });
    }

    if (this.props.isLoading !== nextProps.isLoading) {
      this.props.setInfo && this.props.setInfo({ isLoading: nextProps.isLoading });
    }
  }

  componentWillUnmount() {
    const { resetTaskList, stateId } = this.props;

    resetTaskList({ stateId });
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
    const { updateRequestDocStatus, updateRequestCurrentTasks, record } = this.props;

    updateRequestDocStatus({ record });
    updateRequestCurrentTasks({ record });

    this.getTaskList();
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderTaskList = () => {
    const { tasks, height, isLoading, isSmallMode, forwardedRef } = this.props;

    const childProps = {
      tasks,
      height,
      isLoading,
      isSmallMode,
      onAssignClick: this.onAssignClick,
      onSubmitForm: this.onSubmitForm
    };

    return <TaskList forwardedRef={forwardedRef} {...childProps} />;
  };

  render() {
    const { tasks, height, isLoading, minHeight, maxHeight, isMobile } = this.props;
    const { contentHeight } = this.state;

    if (isMobile) {
      return this.renderTaskList();
    }

    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className="ecos-task-list"
        renderTrackVertical={props => <div {...props} className="ecos-task-list__v-scroll" />}
      >
        <DefineHeight
          fixHeight={height}
          maxHeight={maxHeight}
          minHeight={minHeight}
          isMin={isLoading || isEmpty(tasks)}
          getOptimalHeight={this.setHeight}
        >
          {this.renderTaskList()}
        </DefineHeight>
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks);
