import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';

import { getOutputFormat } from '../../helpers/util';
import { Separator } from '../common';
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

    return (
      <div className="ecos-current-task-info">
        <Headline>{task[DC.title.key]}</Headline>
        <div className="ecos-current-task-info__fields">
          {this.renderLabel('actors')}

          <div
            className={classNames('ecos-current-task-info-value', {
              'ecos-current-task-info-value_mobile': isMobile
            })}
          >
            <span
              className={classNames({
                'ecos-current-task-info-value_mobile-val': isMobile
              })}
            >
              {task[DC.actors.key] || noData}
            </span>
            <span
              className={classNames({
                'ecos-current-task-info-value_mobile-icon': isMobile
              })}
            >
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
            </span>
          </div>

          {isMobile && isOpen && (
            <div className="ecos-current-task-info-value_add">
              {task.usersGroup.map((user, position) => (
                <div key={position} className="ecos-current-task__tooltip-list-item">
                  {user}
                </div>
              ))}
            </div>
          )}

          <Separator noIndents className="ecos-current-task-info__separator" />
          {this.renderLabel('deadline')}
          <div className="ecos-current-task-info-value">{getOutputFormat(DC.deadline.format, task[DC.deadline.key]) || noData}</div>
        </div>
      </div>
    );
  }
}

export default CurrentTaskInfo;
