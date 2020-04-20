import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isSmallMode, t } from '../../../helpers/util';
import UserLocalSettingsService, { DashletProps } from '../../../services/userLocalSettings';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Actions from './Actions';

import './style.scss';

class ActionsDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string,
    record: PropTypes.string,
    title: PropTypes.string,
    classNameContent: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.object,
    dragHandleProps: PropTypes.object,
    canDragging: PropTypes.bool,
    maxHeightByContent: PropTypes.bool
  };

  static defaultProps = {
    classNameContent: '',
    classNameDashlet: '',
    dragHandleProps: {},
    canDragging: false,
    maxHeightByContent: true
  };

  constructor(props) {
    super(props);

    this.stateId = `[${props.tabId}]-[${props.id}]`;
    this.watcher = this.instanceRecord.watch(['caseStatus', 'idocs:documentStatus'], this.reload);

    UserLocalSettingsService.checkOldData(this.stateId);

    this.state = {
      isSmallMode: false,
      fitHeights: {},
      userHeight: UserLocalSettingsService.getDashletHeight(this.stateId),
      isCollapsed: UserLocalSettingsService.getDashletProperty(this.stateId, DashletProps.IS_COLLAPSED)
    };
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  render() {
    const { title, config, classNameDashlet, classNameContent, record, dragHandleProps, canDragging, tabId } = this.props;
    const { isSmallMode, userHeight, fitHeights, isCollapsed, runUpdate } = this.state;

    return (
      <Dashlet
        title={title || t('records-actions.actions')}
        bodyClassName="ecos-actions-dashlet__body"
        className={classNames('ecos-actions-dashlet', classNameDashlet)}
        resizable={true}
        contentMaxHeight={this.clientHeight}
        noActions
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
      >
        <Actions
          {...config}
          forwardedRef={this.contentRef}
          record={record}
          tabId={tabId}
          stateId={this.stateId}
          className={classNameContent}
          isSmallMode={isSmallMode}
          height={userHeight}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          onActionsChanged={this.checkHeight}
          runUpdate={runUpdate}
        />
      </Dashlet>
    );
  }
}

export default ActionsDashlet;
