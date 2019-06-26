import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import TaskDetails from './TaskDetails';
import { TasksPropTypes } from './utils';
import Loader from '../common/Loader/Loader';

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

  className = 'ecos-task-list';

  renderLoader() {
    let { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return (
      <div className={`${this.className}__loader-wrapper`}>
        <Loader />
      </div>
    );
  }

  renderTaskDetailsList() {
    const { tasks, onAssignClick, onSubmitForm, className } = this.props;

    return (
      <React.Fragment>
        {!!(tasks && tasks.length) &&
          tasks.map((item, i) => (
            <TaskDetails key={i + item.id} details={item} onAssignClick={onAssignClick} onSubmitForm={onSubmitForm} className={className} />
          ))}
      </React.Fragment>
    );
  }

  render() {
    const { height } = this.props;

    return (
      <Scrollbars style={{ height }} className={this.className}>
        {this.renderLoader()}
        {this.renderTaskDetailsList()}
      </Scrollbars>
    );
  }
}

export default TaskList;
