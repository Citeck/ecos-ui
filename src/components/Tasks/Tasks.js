import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { t } from '../../helpers/util';
import { changeTaskAssignee, getTaskList } from '../../actions/tasks';
import { selectDataTasksByStateId } from '../../selectors/tasks';
import TaskList from './TaskList';
import './style.scss';

const mapStateToProps = (state, context) => {
  const currentTaskList = selectDataTasksByStateId(state, context.sourceId) || {};

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
    sourceId: PropTypes.string.isRequired,
    document: PropTypes.string.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    sourceId: '',
    document: '',
    className: ''
  };

  componentDidMount() {
    this.getTaskList();
  }

  getTaskList = () => {
    const { getTaskList, sourceId, document } = this.props;

    getTaskList({
      stateId: sourceId,
      sourceId,
      document
    });
  };

  onAssignClick = (taskId, stateAssign, userUid) => {
    const { changeTaskAssignee, sourceId, document } = this.props;

    changeTaskAssignee({
      taskId,
      stateAssign,
      userUid,
      stateId: sourceId,
      sourceId,
      document
    });
  };

  onSubmitForm = () => {
    this.getTaskList();
  };

  render() {
    const { tasks, height, isLoading } = this.props;
    const childProps = { tasks, height, onAssignClick: this.onAssignClick, onSubmitForm: this.onSubmitForm, isLoading };

    return !!(tasks && tasks.length) ? <TaskList {...childProps} /> : t('Нет задач');
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tasks);
