import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import TaskDetails from './TaskDetails';
import { TasksPropTypes } from '../utils';

class TaskList extends React.Component {
  static propTypes = {
    tasks: PropTypes.arrayOf(TasksPropTypes).isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    tasks: [],
    className: ''
  };

  render() {
    const { tasks, height = '100%' } = this.props;

    return (
      <Scrollbars style={{ height }}>
        {!!(tasks && tasks.length) && tasks.map((item, i) => <TaskDetails details={item} key={i} />)}
      </Scrollbars>
    );
  }
}

export default TaskList;
