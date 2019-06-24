import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import TaskDetails from './small/TaskDetails';
import TaskDetailsGrid from './large/TaskDetailsGrid';
import AssignBtn from './AssignBtn';
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

  constructor(props) {
    super(props);

    this.state = {
      isSmallMode: false
    };
  }

  render() {
    const { tasks, height, onAssignClick } = this.props;
    const { isSmallMode } = this.state;
    const classBtn = classNames({ _fill: isSmallMode });

    return (
      <Scrollbars style={{ height }}>
        {!!(tasks && tasks.length) &&
          tasks.map((item, i) => (
            <React.Fragment>
              -- Large mode --
              {!isSmallMode && <TaskDetailsGrid details={item} key={i + item.id} />}
              -- Small mode --
              {isSmallMode && <TaskDetails details={item} key={i + item.id} />}
              <AssignBtn stateAssign={item.stateAssign} onClick={onAssignClick} narrow={!isSmallMode} className={classBtn} />
            </React.Fragment>
          ))}
      </Scrollbars>
    );
  }
}

export default TaskList;
