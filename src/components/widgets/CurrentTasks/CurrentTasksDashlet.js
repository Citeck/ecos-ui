import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getAdaptiveNumberStr, isSmallMode, t } from '../../../helpers/util';
import UserLocalSettingsService, { DashletProps } from '../../../services/userLocalSettings';
import Dashlet, { BaseActions } from '../../Dashlet';
import CurrentTasks from './CurrentTasks';
import BaseWidget from '../BaseWidget';

import './style.scss';

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
    maxHeightByContent: true
  };

  constructor(props) {
    super(props);

    UserLocalSettingsService.checkOldData(props.id);

    this.watcher = this.instanceRecord.watch('cm:modified', this.reload);

    this.state = {
      isSmallMode: false,
      fitHeights: {},
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getDashletProperty(props.id, DashletProps.IS_COLLAPSED),
      totalCount: 0,
      isLoading: true
    };
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  setInfo = data => {
    this.setState(data);
  };

  render() {
    const { title, config, classNameTasks, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, runUpdate, userHeight, fitHeights, isCollapsed, totalCount, isLoading } = this.state;
    const actions = {
      [BaseActions.RELOAD]: {
        onClick: () => this.reload()
      }
    };

    return (
      <Dashlet
        title={title || t('current-tasks-widget.title')}
        bodyClassName="ecos-current-task-list-dashlet__body"
        className={classNames('ecos-current-task-list-dashlet', classNameDashlet)}
        resizable
        contentMaxHeight={this.clientHeight}
        actionConfig={actions}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        badgeText={getAdaptiveNumberStr(totalCount)}
        noBody={!totalCount && !isLoading}
      >
        <CurrentTasks
          {...config}
          forwardedRef={this.contentRef}
          className={classNameTasks}
          record={record}
          isSmallMode={isSmallMode}
          stateId={record}
          height={userHeight}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          setInfo={this.setInfo}
          runUpdate={runUpdate}
        />
      </Dashlet>
    );
  }
}

export default CurrentTasksDashlet;
