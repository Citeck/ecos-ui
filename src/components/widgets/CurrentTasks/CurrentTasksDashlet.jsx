import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import * as React from 'react';

import { getStateId } from '../../../helpers/store';
import { getAdaptiveNumberStr, isSmallMode, t } from '../../../helpers/util';
import DAction from '../../../services/DashletActionService';
import Dashlet from '../../Dashlet';
import BaseWidget, { EVENTS } from '../BaseWidget';

import CurrentTasks from './CurrentTasks';

import './style.scss';

// Все задачи
class CurrentTasksDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameTasks: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    classNameTasks: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: false
  };

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);

    this.state = {
      ...this.state,
      isSmallMode: false,
      totalCount: 0,
      isLoading: true,
      isOpenSettings: false
    };

    this.instanceRecord.events.on(EVENTS.UPDATE_TASKS_WIDGETS, this.reload);
  }

  get actions() {
    return {
      [DAction.Actions.RELOAD]: {
        onClick: () => this.reload()
      },
      [DAction.Actions.SETTINGS]: {
        onClick: this.onToggleSettings
      }
    };
  }

  onResize = width => {
    !!width && this.setState({ isSmallMode: isSmallMode(width) });
  };

  onToggleSettings = () => {
    this.setState(state => ({ isOpenSettings: !state.isOpenSettings }));
  };

  onSaveSettings = settings => {
    const { id, onSave } = this.props;

    this.setState({
      isOpenSettings: false
    });

    if (isFunction(onSave)) {
      onSave(id, { config: { settings } });
    }
  };

  setInfo = data => {
    this.setState(data);
  };

  render() {
    const { title, config, classNameTasks, classNameDashlet, record, dragHandleProps, canDragging, ...props } = this.props;
    const { isSmallMode, runUpdate, totalCount, isLoading, isOpenSettings } = this.state;

    return (
      <Dashlet
        {...props}
        title={title || t('current-tasks-widget.title')}
        bodyClassName="ecos-current-task-list-dashlet__body"
        className={classNames('ecos-current-task-list-dashlet', classNameDashlet)}
        resizable
        contentMaxHeight={this.clientHeight}
        actionConfig={this.actions}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        badgeText={getAdaptiveNumberStr(totalCount)}
        noBody={!totalCount && !isLoading}
        setRef={this.setDashletRef}
      >
        <CurrentTasks
          {...config}
          instanceRecord={this.instanceRecord}
          forwardedRef={this.contentRef}
          className={classNameTasks}
          record={record}
          isSmallMode={isSmallMode}
          stateId={this.stateId}
          height={this.contentHeight}
          setInfo={this.setInfo}
          runUpdate={runUpdate}
          scrollbarProps={this.scrollbarProps}
          isOpenSettings={isOpenSettings}
          onSaveSettings={this.onSaveSettings}
          onToggleSettings={this.onToggleSettings}
        />
      </Dashlet>
    );
  }
}

export default CurrentTasksDashlet;
