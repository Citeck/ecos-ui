import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';

import { getOutputFormat, prepareTooltipId } from '../../../helpers/util';
import { Tooltip } from '../../common';
import { Headline } from '../../common/form';
import { cleanTaskId, CurrentTaskPropTypes, DisplayedColumns as DC, noData } from './utils';
import BtnTooltipInfo from './BtnTooltipInfo';

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

  renderUsersGroup(list) {
    if (!list || (list && !list.length)) {
      return <div className="ecos-current-task__tooltip-list-item">{noData}</div>;
    }

    return (
      <>
        {list.map((user, position) => (
          <div key={position} className="ecos-current-task__tooltip-list-item">
            {user}
          </div>
        ))}
      </>
    );
  }

  render() {
    const { task, isMobile } = this.props;
    const { isOpen } = this.state;
    const id = prepareTooltipId(`tooltip-${task.id}`);

    return (
      <div className="ecos-current-task-info">
        <Headline className="ecos-current-task-info__title" title={task[DC.title.key]} text={task[DC.title.key]} />
        <div className="ecos-current-task-info__fields">
          <div className="ecos-current-task-info__fields-item">
            {this.renderLabel('actors')}

            <div
              className={classNames('ecos-current-task-info-value', {
                'ecos-current-task-info-value_mobile': isMobile
              })}
            >
              <Tooltip showAsNeeded target={id} uncontrolled text={task[DC.actors.key] || noData}>
                <div id={id} className="ecos-current-task-info-value__text">
                  {task[DC.actors.key] || noData}
                </div>
              </Tooltip>

              {task.usersGroup && (
                <BtnTooltipInfo
                  iconClass="icon-users"
                  id={uniqueId(cleanTaskId(task.id))}
                  isShow={task.isGroup}
                  noTooltip={isMobile}
                  handleClick={isOpen => this.setState({ isOpen })}
                  isActive={isOpen}
                  count={task.count}
                >
                  {this.renderUsersGroup(task.usersGroup)}
                </BtnTooltipInfo>
              )}
            </div>
          </div>

          {isMobile && isOpen && (
            <div className="ecos-current-task-info-value ecos-current-task-info-value_add">{this.renderUsersGroup(task.usersGroup)}</div>
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
