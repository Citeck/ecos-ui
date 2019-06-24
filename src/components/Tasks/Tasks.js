import * as React from 'react';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import queryString from 'query-string';
import TaskList_small from './small/TaskList';
import { changeTaskDetails, getDashletTasks } from '../../actions/tasks';

const mapStateToProps = state => ({
  tasks: state.tasks.list
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

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: true
    };
  }

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

  onAssignClick = taskId => {
    const { changeTaskDetails, id } = this.props;

    changeTaskDetails({ taskId, sourceId: id, recordRef: this.urlInfo.recordRef });
  };

  render() {
    const { tasks, height = '100%' } = this.props;
    const { isSmallMode } = this.state;
    const childProps = { tasks, height, onAssignClick: this.onAssignClick };

    return (
      <div>
        --Small mode--
        {isSmallMode && <TaskList_small {...childProps} />}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Tasks));
