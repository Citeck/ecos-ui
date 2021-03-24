import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';

import { changeTaskAssignee, getTaskList, resetTaskList } from '../../../actions/tasks';
import { selectStateTasksById } from '../../../selectors/tasks';
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

  getTaskList = () => {
    const { getTaskList } = this.props;

    getTaskList();
  };

  onAssignClick = sentData => {
    const { changeTaskAssignee } = this.props;

    changeTaskAssignee(sentData);
  };

  onSubmitForm = () => {
    Records.get(this.props.record).update();
    this.getTaskList();
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderTaskList = () => {
    const { tasks, isLoading, isSmallMode, forwardedRef } = this.props;

    const childProps = {
      tasks,
      isLoading,
      isSmallMode,
      onAssignClick: this.onAssignClick,
      onSubmitForm: this.onSubmitForm
    };

    return <TaskList forwardedRef={forwardedRef} {...childProps} />;
  };

  render() {
    const { isMobile, scrollbarProps } = this.props;

    if (isMobile) {
      return this.renderTaskList();
    }

    return (
      <Scrollbars
        className="ecos-task-list"
        renderTrackVertical={props => <div {...props} className="ecos-task-list__v-scroll" />}
        {...scrollbarProps}
      >
        {this.renderTaskList()}
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks);
