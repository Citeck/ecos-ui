import * as React from 'react';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import queryString from 'query-string';
import TaskList from './small/TaskList';
import { getDashletTasks } from '../../actions/tasks';

const mapStateToProps = state => ({
  tasks: state.tasks.list
});

const mapDispatchToProps = dispatch => ({
  getDashletTasks: payload => dispatch(getDashletTasks(payload))
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

  render() {
    const { tasks, height = '100%' } = this.props;
    const childProps = { tasks, height };

    return (
      <div>
        --Small mode--
        <TaskList {...childProps} />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(Tasks));
