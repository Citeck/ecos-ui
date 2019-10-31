import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';

import { getOutputFormat } from '../../helpers/util';
import { Headline } from '../common/form';
import { cleanTaskId, CurrentTaskPropTypes, DisplayedColumns as DC, noData } from './utils';
import IconInfo from './IconInfo';

class CurrentTaskInfo extends React.Component {
  static propTypes = {
    task: PropTypes.shape(CurrentTaskPropTypes).isRequired,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    isMobile: false
  };

  state = {
    isOpen: false
  };

  renderLabel = key => <div className="ecos-current-task-info-label">{DC[key].label}</div>;

  render() {
    const { task, isMobile } = this.props;
    const { isOpen } = this.state;

    console.warn(task.usersGroup);

    return (
      <div className="ecos-current-task-info">
        <Headline>{task[DC.title.key]}</Headline>
        <div className="ecos-current-task-info__fields">
          <div className="ecos-current-task-info__fields-item">
            {this.renderLabel('actors')}

            <div
              className={classNames('ecos-current-task-info-value', {
                'ecos-current-task-info-value_mobile': isMobile,
                'ecos-current-task-info-value_full': !task.usersGroup.length
              })}
            >
              <span
                className={classNames('ecos-current-task-info-value', {
                  'ecos-current-task-info-value_mobile-val': isMobile,
                  'ecos-current-task-info-value_full': !task.usersGroup.length
                })}
              >
                {task[DC.actors.key] || noData}
              </span>

              {task.usersGroup && (
                <IconInfo
                  iconClass={'icon-usergroup'}
                  id={uniqueId(cleanTaskId(task.id))}
                  isShow={task.isGroup}
                  noTooltip={isMobile}
                  handleClick={res => this.setState({ isOpen: res })}
                >
                  {task.usersGroup.map((user, position) => (
                    <div key={position} className="ecos-current-task__tooltip-list-item">
                      {user}
                    </div>
                  ))}
                </IconInfo>
              )}
            </div>
          </div>

          {isMobile && isOpen && (
            <div className="ecos-current-task-info-value ecos-current-task-info-value_add">
              {task.usersGroup.map((user, position) => (
                <div key={position} className="ecos-current-task__tooltip-list-item">
                  {user}
                </div>
              ))}
            </div>
          )}

          <div className="ecos-current-task-info__fields-item">
            {this.renderLabel('deadline')}
            <div className="ecos-current-task-info-value">{getOutputFormat(DC.deadline.format, task[DC.deadline.key]) || noData}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default CurrentTaskInfo;
