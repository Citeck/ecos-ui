import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import { getOutputFormat, prepareTooltipId } from '../../../helpers/util';
import { Icon, Tooltip } from '../../common';
import { DropdownOuter, Headline } from '../../common/form';
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
    isOpenUsers: false,
    isOpenActions: false
  };

  constructor(props) {
    super(props);

    const id = props.task.id;

    this.tooltipTitleId = prepareTooltipId(`tooltip-title-${id}`);
    this.tooltipUsersId = prepareTooltipId(`tooltip-users-${id}`);
  }

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
    const { task, isMobile, actions } = this.props;
    const { isOpenUsers, isOpenActions } = this.state;

    return (
      <div className="ecos-current-task-info">
        <Headline className="ecos-current-task-info__head">
          <Tooltip uncontrolled showAsNeeded target={this.tooltipTitleId} text={task[DC.title.key]}>
            <span className="ecos-current-task-info__head-title" id={this.tooltipTitleId}>
              {task[DC.title.key]}
            </span>
          </Tooltip>
          {!isEmpty(actions) && (
            <>
              <DropdownOuter
                className="ecos-current-task__action-dropdown"
                source={actions}
                valueField={'icon'}
                titleField={'name'}
                keyFields={['icon', 'name']}
                isStatic
                getStateOpen={isOpenActions => this.setState({ isOpenActions })}
                CustomItem={MenuItem}
              >
                <Icon className={isOpenActions ? 'icon-custom-more-small-pressed' : 'icon-custom-more-small-normal'} />
              </DropdownOuter>
            </>
          )}
        </Headline>
        <div className="ecos-current-task-info__fields">
          <div className="ecos-current-task-info__fields-item">
            {this.renderLabel('actors')}

            <div
              className={classNames('ecos-current-task-info-value', {
                'ecos-current-task-info-value_mobile': isMobile
              })}
            >
              <Tooltip showAsNeeded uncontrolled target={this.tooltipUsersId} text={task[DC.actors.key] || noData}>
                <div id={this.tooltipUsersId} className="ecos-current-task-info-value__text">
                  {task[DC.actors.key] || noData}
                </div>
              </Tooltip>

              {task.usersGroup && (
                <BtnTooltipInfo
                  iconClass="icon-users"
                  id={uniqueId(cleanTaskId(task.id))}
                  isShow={task.isGroup}
                  noTooltip={isMobile}
                  handleClick={isOpenUsers => this.setState({ isOpenUsers })}
                  isActive={isOpenUsers}
                  count={task.count}
                >
                  {this.renderUsersGroup(task.usersGroup)}
                </BtnTooltipInfo>
              )}
            </div>
          </div>

          {isMobile && isOpenUsers && (
            <div className="ecos-current-task-info-value ecos-current-task-info-value_mobile-list">
              {this.renderUsersGroup(task.usersGroup)}
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

class MenuItem extends React.PureComponent {
  componentWillUnmount() {
    this.handleClick.cancel();
  }

  handleClick = debounce((...data) => {
    const onClick = get(this.props, 'item.onClick');

    if (typeof onClick === 'function') {
      onClick(...data);
    }
  }, 350);

  render() {
    const { icon, name } = this.props.item;

    return (
      <li onClick={this.handleClick} className="ecos-current-task__action-menu-item">
        <Icon className={icon} />
        <span>{name}</span>
      </li>
    );
  }
}

export default CurrentTaskInfo;
