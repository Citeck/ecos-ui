import * as React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import { t } from '../../../helpers/util';
import { InfoText, Loader } from '../../common/index';
import TaskDetails from './TaskDetails';
import { TaskPropTypes } from './utils';

class TaskList extends React.Component {
  static propTypes = {
    tasks: PropTypes.arrayOf(PropTypes.shape(TaskPropTypes)).isRequired,
    className: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isLoading: PropTypes.bool,
    isSmallMode: PropTypes.bool,
    onAssignClick: PropTypes.func,
    onSubmitForm: PropTypes.func,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
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

  contentRef = React.createRef();

  renderLoader() {
    const { isLoading, height } = this.props;

    if (!isLoading) {
      return null;
    }

    return <Loader className="ecos-task-list__loader" style={{ height: `${height}px` }} />;
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
      </React.Fragment>
    ));
  }

  render() {
    return (
      <div ref={this.props.forwardedRef}>
        {this.renderLoader()}
        {this.renderEmptyInfo()}
        {this.renderTaskDetailsList()}
      </div>
    );
  }
}

export default TaskList;
