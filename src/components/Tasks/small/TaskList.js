import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import TaskDetails from './TaskDetails';
import { TasksPropTypes } from '../utils';
import AssignBtn from '../AssignBtn';

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
    const { tasks, height, onAssignClick } = this.props;

    return (
      <Scrollbars style={{ height }}>
        {!!(tasks && tasks.length) &&
          tasks.map((item, i) => (
            <React.Fragment>
              <TaskDetails details={item} key={i} />
              <AssignBtn stateAssign={item.stateAssign} onClick={onAssignClick} />
            </React.Fragment>
          ))}
      </Scrollbars>
    );
  }
}

export default TaskList;
