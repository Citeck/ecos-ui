import * as React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';

import { t } from '../../../helpers/util';
import { InfoText, Loader } from '../../common/index';
import TaskDetails from './TaskDetails';
import { TaskPropTypes } from './utils';

class TaskList extends React.Component {
  static propTypes = {
    tasks: PropTypes.arrayOf(PropTypes.shape(TaskPropTypes)).isRequired,
    className: PropTypes.string,
    isLoading: PropTypes.bool,
    isSmallMode: PropTypes.bool,
    onAssignClick: PropTypes.func,
    onSubmitForm: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    tasks: [],
    className: '',
    isLoading: false,
    isSmallMode: false,
    onAssignClick: () => {},
    onSubmitForm: () => {}
  };

  contentRef = React.createRef();

  renderLoader() {
    const { isLoading } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader blur />;
  }

  renderEmptyInfo() {
    const { tasks, isLoading } = this.props;

    if (isLoading || !isEmpty(tasks)) {
      return null;
    }

    return <InfoText text={t('tasks-widget.no-tasks')} />;
  }

  renderTaskDetailsList() {
    const { tasks, onAssignClick, onSubmitForm, className, isSmallMode, runUpdate } = this.props;

    if (isEmpty(tasks)) {
      return null;
    }

    return tasks.map(item => (
      <React.Fragment key={item.id}>
        <TaskDetails
          details={item}
          onAssignClick={onAssignClick}
          onSubmitForm={onSubmitForm}
          className={className}
          isSmallMode={isSmallMode}
          runUpdate={runUpdate}
        />
      </React.Fragment>
    ));
  }

  render() {
    const { isLoading } = this.props;

    return (
      <div
        ref={this.props.forwardedRef}
        className={classNames('ecos-task-list__container', {
          'ecos-task-list__container_min-height': isLoading
        })}
      >
        {this.renderLoader()}
        {this.renderEmptyInfo()}
        {this.renderTaskDetailsList()}
      </div>
    );
  }
}

export default TaskList;
