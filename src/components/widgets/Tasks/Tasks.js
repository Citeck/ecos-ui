import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import * as React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import { changeTaskAssignee, getTaskList, resetTaskList } from '../../../actions/tasks';
import { selectStateTasksById } from '../../../selectors/tasks';
import Records from '../../Records';
import { EVENTS } from '../BaseWidget';

import TaskList from './TaskList';

import './style.scss';

const mapStateToProps = (state, context) => {
  const tasksState = selectStateTasksById(state, context.stateId) || {};

  return {
    tasks: tasksState.list,
    isLoading: tasksState.isLoading,
    totalCount: tasksState.totalCount,
    isMobile: context.isMobile || state.view.isMobile
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const { record, stateId } = props;

  return {
    getTaskList: () => dispatch(getTaskList({ stateId, record })),
    changeTaskAssignee: payload => dispatch(changeTaskAssignee({ stateId, record, ...payload })),
    resetTaskList: () => dispatch(resetTaskList({ stateId }))
  };
};

class Tasks extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    taskId: PropTypes.string,
    isSmallMode: PropTypes.bool,
    runUpdate: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setInfo: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    scrollbarProps: PropTypes.object
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

    let info = null;

    if (this.props.totalCount !== prevProps.totalCount) {
      info = { ...info, totalCount: this.props.totalCount };
    }

    if (this.props.isLoading !== prevProps.isLoading) {
      info = { ...info, isLoading: this.props.isLoading };
    }

    if (info) {
      this.props.setInfo && this.props.setInfo(info);
    }
  }

  componentWillUnmount() {
    const { resetTaskList } = this.props;

    resetTaskList();
  }

  getTaskList = debounce(() => this.props.getTaskList(), 400);

  onAssignClick = sentData => {
    const { changeTaskAssignee, instanceRecord } = this.props;

    changeTaskAssignee(sentData);
    if (instanceRecord) {
      instanceRecord.events.emit(EVENTS.UPDATE_TASKS_WIDGETS);
    }
  };

  onSubmitForm = () => {
    const { instanceRecord, onSubmit } = this.props;
    Records.get(this.props.record).update();
    if (instanceRecord) {
      instanceRecord.events.emit(EVENTS.UPDATE_TASKS_WIDGETS);
    }

    if (isFunction(onSubmit)) {
      onSubmit();
    }
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderTaskList = () => {
    const { tasks, taskId, isLoading, isSmallMode, forwardedRef, runUpdate, setFormRef } = this.props;

    const childProps = {
      tasks,
      isLoading,
      isSmallMode,
      runUpdate,
      taskId,
      onAssignClick: this.onAssignClick,
      onSubmitForm: this.onSubmitForm
    };

    return <TaskList forwardedRef={forwardedRef} setFormRef={setFormRef} {...childProps} />;
  };

  render() {
    const { isMobile, scrollbarProps } = this.props;

    if (isMobile) {
      return this.renderTaskList();
    }

    return (
      <Scrollbars
        className="ecos-task-list"
        hideTracksWhenNotNeeded
        renderTrackVertical={props => <div {...props} className="ecos-task-list__v-scroll" />}
        {...scrollbarProps}
      >
        {this.renderTaskList()}
      </Scrollbars>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Tasks);
