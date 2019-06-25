import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import TaskDetails from './TaskDetails';
import { TasksPropTypes } from './utils';

class TaskList extends React.Component {
  static propTypes = {
    tasks: PropTypes.arrayOf(TasksPropTypes).isRequired,
    className: PropTypes.string,
    height: PropTypes.string
  };

  static defaultProps = {
    tasks: [],
    className: '',
    height: '100%'
  };

  render() {
    const { tasks, height, onAssignClick, className } = this.props;

    return (
      <Scrollbars style={{ height }}>
        {!!(tasks && tasks.length) &&
          tasks.map((item, i) => <TaskDetails key={i + item.id} details={item} onAssignClick={onAssignClick} className={className} />)}
      </Scrollbars>
    );
  }
}

export default TaskList;
