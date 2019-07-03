import * as React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import isEmpty from 'lodash/isEmpty';
import { getOutputFormat, t } from '../../helpers/util';
import Loader from '../common/Loader/Loader';
import { CurrentTaskPropTypes, DisplayedColumns } from './utils';
import { Caption } from '../common/form';

class CurrentTaskList extends React.Component {
  static propTypes = {
    currentTasks: PropTypes.arrayOf(CurrentTaskPropTypes).isRequired,
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
    const { currentTasks, onAssignClick, className } = this.props;
    const classInfo = `${className} ${this.className}_view-enum`;

    return (
      <div className={className}>
        {currentTasks.map((item, i) => (
          <div className={classInfo} key={item.id + i}>
            <Caption className={`${classInfo}__title`} middle>
              {item[DisplayedColumns.title.key]}
            </Caption>

            <div className={`${classInfo}-label`}>{DisplayedColumns.actors.label}</div>
            <div className={`${classInfo}-value`}>{item[DisplayedColumns.actors.key]}</div>

            <div className={`${classInfo}-label`}>{DisplayedColumns.deadline.label}</div>
            <div className={`${classInfo}-value`}>
              {getOutputFormat(DisplayedColumns.deadline.format, item[DisplayedColumns.deadline.key])}
            </div>
          </div>
        ))}
      </div>
    );
  }

  renderList() {
    const { currentTasks, onAssignClick, className } = this.props;

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

    // if (isSmallMode) {
    if (true) {
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
