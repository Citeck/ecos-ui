import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { changeTaskAssignee, getTaskList } from '../../actions/tasks';
import { selectDataTasksByStateId } from '../../selectors/tasks';
import { DefineHeight } from '../common';
import TaskList from './TaskList';

import './style.scss';

const mapStateToProps = (state, context) => {
  const tasksState = selectDataTasksByStateId(state, context.stateId) || {};

  return {
    tasks: tasksState.list,
    isLoading: tasksState.isLoading
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
    setReloadDone: PropTypes.func,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    isSmallMode: false,
    isRunReload: false,
    setReloadDone: () => {}
  };

  state = {
    contentHeight: 0
  };

  className = 'ecos-task-list';

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

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  render() {
    const { tasks, height, isLoading, isSmallMode, minHeight, maxHeight } = this.props;
    const childProps = {
      tasks,
      height,
      isLoading,
      isSmallMode,
      onAssignClick: this.onAssignClick,
      onSubmitForm: this.onSubmitForm
    };
    const { contentHeight } = this.state;

    return (
      <Scrollbars
        style={{ height: contentHeight }}
        className={this.className}
        renderTrackVertical={props => <div {...props} className={`${this.className}__v-scroll`} />}
      >
        <DefineHeight fixHeight={height} maxHeight={maxHeight} minHeight={minHeight} isMin={isLoading} getHeight={this.setHeight}>
          <TaskList {...childProps} />
        </DefineHeight>
      </Scrollbars>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks);
