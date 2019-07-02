import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { changeTaskAssignee, getTaskList } from '../../actions/tasks';
import { selectDataTasksByStateId } from '../../selectors/tasks';
import TaskList from './TaskList';
import './style.scss';

const mapStateToProps = (state, context) => {
  const currentTaskList = selectDataTasksByStateId(state, context.document) || {};

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
    document: PropTypes.string.isRequired,
    className: PropTypes.string,
    isRunReload: PropTypes.bool,
    setReloadDone: PropTypes.func
  };

  static defaultProps = {
    document: '',
    className: '',
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
    const { getTaskList, document } = this.props;

    getTaskList({
      stateId: document,
      document
    });
  };

  onAssignClick = ({ taskId, actionOfAssignment, ownerUserName }) => {
    const { changeTaskAssignee, document } = this.props;

    changeTaskAssignee({
      actionOfAssignment,
      ownerUserName,
      stateId: document,
      taskId
    });
  };

  onSubmitForm = () => {
    this.getTaskList();
  };

  render() {
    const { tasks, height, isLoading } = this.props;
    const childProps = { tasks, height, onAssignClick: this.onAssignClick, onSubmitForm: this.onSubmitForm, isLoading };

    return <TaskList {...childProps} />;
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks);
