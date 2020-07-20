import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getAdaptiveNumberStr, isSmallMode, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import DAction from '../../../services/DashletActionService';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Tasks from './Tasks';

import './style.scss';

class TasksDashlet extends BaseWidget {
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
    maxHeightByContent: true
  };

  _observableFieldsToUpdate = [];

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      isSmallMode: false,
      totalCount: 0,
      isLoading: true
    };

    this.observableFieldsToUpdate = [...new Set([...this.observableFieldsToUpdate, 'tasks.active-hash'])];
  }

  onResize = width => {
    !!width && this.setState({ isSmallMode: isSmallMode(width) });
  };

  setInfo = data => {
    this.setState(data);
  };

  render() {
    const { title, config, classNameTasks, classNameDashlet, record, dragHandleProps, canDragging, tabId, id } = this.props;
    const stateId = getStateId({ tabId, id });
    const { runUpdate, isSmallMode, userHeight, fitHeights, isCollapsed, totalCount, isLoading } = this.state;
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: this.reload.bind(this)
      }
    };

    return (
      <Dashlet
        title={title || t('tasks-widget.title')}
        bodyClassName="ecos-task-list-dashlet__body"
        className={classNames('ecos-task-list-dashlet', classNameDashlet)}
        resizable={true}
        needGoTo={false}
        actionConfig={actions}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        contentMaxHeight={this.clientHeight}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        badgeText={getAdaptiveNumberStr(totalCount)}
        noBody={!totalCount && !isLoading}
      >
        <Tasks
          {...config}
          forwardedRef={this.contentRef}
          className={classNameTasks}
          record={record}
          stateId={stateId}
          runUpdate={runUpdate}
          isSmallMode={isSmallMode}
          height={userHeight}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          setInfo={this.setInfo}
        />
      </Dashlet>
    );
  }
}

export default TasksDashlet;
