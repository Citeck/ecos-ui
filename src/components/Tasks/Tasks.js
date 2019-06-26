import * as React from 'react';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import queryString from 'query-string';
import Loader from '../common/Loader/Loader';
import TaskList from './TaskList';
import { changeTaskDetails, getDashletTasks } from '../../actions/tasks';
import './style.scss';
import { AssignOptions } from '../../constants/tasks';

const mapStateToProps = state => ({
  tasks: state.tasks.list,
  isLoading: state.tasks.isLoading,
  currentUserUid: state.user.uid
});

const mapDispatchToProps = dispatch => ({
  getDashletTasks: payload => dispatch(getDashletTasks(payload)),
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
    const { getDashletTasks, id } = this.props;

    getDashletTasks({ sourceId: id, recordRef: this.urlInfo.recordRef });
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

  render() {
    const { tasks, height, isLoading } = this.props;
    const childProps = { tasks, height, onAssignClick: this.onAssignClick };

    return (
      <div>
        {isLoading && <Loader />}
        <TaskList {...childProps} />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Tasks));
