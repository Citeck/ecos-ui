import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';

import { changeTaskAssignee, getTaskList, resetTaskList } from '../../../actions/tasks';
import { selectStateTasksById } from '../../../selectors/tasks';
import { DefineHeight } from '../../common';
import Records from '../../Records';
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
  resetTaskList: payload => dispatch(resetTaskList(payload))
});

class Tasks extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    runUpdate: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setInfo: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    className: '',
    isSmallMode: false
  };

  state = {
    contentHeight: 0
  };

  componentDidMount() {
    this.getTaskList();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.runUpdate && !prevProps.runUpdate) {
      this.getTaskList();
    }

    if (this.props.totalCount !== prevProps.totalCount) {
      this.props.setInfo && this.props.setInfo({ totalCount: this.props.totalCount });
    }

    if (this.props.isLoading !== prevProps.isLoading) {
      this.props.setInfo && this.props.setInfo({ isLoading: this.props.isLoading });
    }
  }

  componentWillUnmount() {
    const { resetTaskList, stateId } = this.props;

    resetTaskList({ stateId });
  }

  getTaskList = () => {
    const { getTaskList, record, stateId } = this.props;

    getTaskList({ stateId, record });
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
    Records.get(this.props.record).update();
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

export default connect(mapStateToProps, mapDispatchToProps)(Tasks);
