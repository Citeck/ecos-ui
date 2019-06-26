import * as React from 'react';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import queryString from 'query-string';
import TaskList from './TaskList';
import { changeTaskDetails, getTaskList } from '../../actions/tasks';
import './style.scss';
import { AssignOptions } from '../../constants/tasks';
import { selectDashletTaskList } from '../../selectors/tasks';

const mapStateToProps = (state, context) => {
  const currentTaskList = selectDashletTaskList(state, context.id) || {};

  return {
    tasks: currentTaskList.list,
    isLoading: currentTaskList.isLoading,
    currentUserUid: state.user.uid
  };
};

const mapDispatchToProps = dispatch => ({
  getTaskList: payload => dispatch(getTaskList(payload)),
  changeTaskDetails: payload => dispatch(changeTaskDetails(payload))
});

class Tasks extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    id: '',
    className: ''
  };

  componentDidMount() {
    this.getTaskList();
  }

  get urlInfo() {
    const {
      location: { search = '' }
    } = this.props;
    const searchParam = queryString.parse(search);
    const { recordRef } = searchParam;

    return {
      recordRef
    };
  }

  getTaskList = () => {
    const { getTaskList, id } = this.props;

    getTaskList({ sourceId: id, recordRef: this.urlInfo.recordRef });
  };

  onAssignClick = (taskId, stateAssign, userUid) => {
    const { changeTaskDetails, id, currentUserUid } = this.props;

    switch (stateAssign) {
      case AssignOptions.ASSIGN_ME:
        userUid = currentUserUid;
        break;
      case AssignOptions.UNASSIGN:
        userUid = '';
        break;
      default:
        break;
    }

    changeTaskDetails({ taskId, sourceId: id, recordRef: this.urlInfo.recordRef, stateAssign, userUid });
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
)(withRouter(Tasks));
