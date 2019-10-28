import * as React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { isLastItem, t } from '../../helpers/util';
import { InfoText, Loader, Separator } from '../common';
import TaskDetails from './TaskDetails';
import { TaskPropTypes } from './utils';

class TaskList extends React.Component {
  static propTypes = {
    tasks: PropTypes.arrayOf(PropTypes.shape(TaskPropTypes)).isRequired,
    className: PropTypes.string,
    height: PropTypes.string,
    isLoading: PropTypes.bool,
    isSmallMode: PropTypes.bool,
    onAssignClick: PropTypes.func,
    onSubmitForm: PropTypes.func
  };

  static defaultProps = {
    tasks: [],
    className: '',
    height: '100%',
    isLoading: false,
    isSmallMode: false,
    onAssignClick: () => {},
    onSubmitForm: () => {}
  };

  renderLoader() {
    let { isLoading } = this.props;

    return isLoading && <Loader className="ecos-task-list__loader" />;
  }

  renderEmptyInfo() {
    const { tasks, isLoading } = this.props;

    if (isLoading || !isEmpty(tasks)) {
      return null;
    }

    return <InfoText text={t('tasks-widget.no-tasks')} />;
  }

  renderTaskDetailsList() {
    const { tasks, onAssignClick, onSubmitForm, className, isLoading, isSmallMode } = this.props;

    if (isLoading || isEmpty(tasks)) {
      return null;
    }

    return tasks.map((item, i) => (
      <React.Fragment key={i + item.id}>
        <TaskDetails
          details={item}
          onAssignClick={onAssignClick}
          onSubmitForm={onSubmitForm}
          className={className}
          isSmallMode={isSmallMode}
        />
        {!isLastItem(tasks, i) && <Separator noIndents />}
      </React.Fragment>
    ));
  }

  render() {
    return (
      <React.Fragment>
        {this.renderLoader()}
        {this.renderEmptyInfo()}
        {this.renderTaskDetailsList()}
      </React.Fragment>
    );
  }
}

export default TaskList;
