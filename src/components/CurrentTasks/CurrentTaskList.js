import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';
import Loader from '../common/Loader/Loader';
import { isLastItem, t } from '../../helpers/util';
import Separator from '../common/Separator/Separator';

const TasksPropTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  actors: PropTypes.string,
  deadline: PropTypes.any
};

class CurrentTaskList extends React.Component {
  static propTypes = {
    currentTasks: PropTypes.arrayOf(TasksPropTypes).isRequired,
    className: PropTypes.string,
    height: PropTypes.string
  };

  static defaultProps = {
    currentTasks: [],
    className: '',
    height: '100%'
  };

  className = 'ecos-current-task-list';

  renderLoader() {
    return (
      <div className={`${this.className}__loader-wrapper`}>
        <Loader />
      </div>
    );
  }

  renderEmpty() {
    return <div className={this.className + '_empty'}>{t('Нет задач')}</div>;
  }

  renderEnum() {
    const { currentTasks, onAssignClick, className, isLoading, isSmallMode } = this.props;

    return (
      <React.Fragment>
        {currentTasks.map((item, i) => (
          <div key={i + item.id}>
            {item.title}
            {!isLastItem(currentTasks, i) && <Separator noIndents />}
          </div>
        ))}
      </React.Fragment>
    );
  }

  renderList() {
    const { currentTasks, onAssignClick, className, isLoading, isSmallMode } = this.props;

    if (isLoading || isEmpty(currentTasks)) {
      return null;
    }

    return (
      <React.Fragment>
        {currentTasks.map((item, i) => (
          <div key={i + item.id}>{item.title}</div>
        ))}
      </React.Fragment>
    );
  }

  renderSwitch() {
    const { isSmallMode, isLoading, currentTasks } = this.props;
    const isEmptyList = isEmpty(currentTasks);

    if (isLoading) {
      return this.renderLoader();
    }

    if (isEmptyList) {
      return this.renderEmpty();
    }

    if (isSmallMode) {
      return this.renderEnum();
    }

    return this.renderList();
  }

  render() {
    const { height } = this.props;

    return (
      <Scrollbars
        style={{ height }}
        className={this.className}
        renderTrackVertical={props => <div {...props} className={`${this.className}__v-scroll`} />}
      >
        {this.renderSwitch()}
      </Scrollbars>
    );
  }
}

export default CurrentTaskList;
