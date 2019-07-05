import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';
import { isLastItem, t } from '../../helpers/util';
import Loader from '../common/Loader/Loader';
import Separator from '../common/Separator/Separator';
import TaskDetails from './TaskDetails';
import { TaskPropTypes } from './utils';

class TaskList extends React.Component {
  static propTypes = {
    tasks: PropTypes.arrayOf(TaskPropTypes).isRequired,
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

  renderEmptyInfo() {
    const { tasks, isLoading } = this.props;

    if (isLoading || !isEmpty(tasks)) {
      return null;
    }

    return <div className={this.className + '_empty'}>{t('Задач нет')}</div>;
  }

  renderTaskDetailsList() {
    const { tasks, onAssignClick, onSubmitForm, className, isLoading, isSmallMode } = this.props;

    if (isLoading || isEmpty(tasks)) {
      return null;
    }

    return (
      <React.Fragment>
        {tasks.map((item, i) => (
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
        ))}
      </React.Fragment>
    );
  }

  render() {
    const { height } = this.props;

    return (
      <Scrollbars
        style={{ height }}
        className={this.className}
        renderTrackVertical={props => <div {...props} className={`${this.className}__v-scroll`} />}
      >
        {this.renderLoader()}
        {this.renderEmptyInfo()}
        {this.renderTaskDetailsList()}
      </Scrollbars>
    );
  }
}

export default TaskList;
