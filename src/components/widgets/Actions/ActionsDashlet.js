import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isSmallMode, t } from '../../../helpers/util';
import UserLocalSettingsService from '../../../services/userLocalSettings';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Actions from './Actions';

import './style.scss';

class ActionsDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
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

    UserLocalSettingsService.checkOldData(props.id);

    this.watcher = this.instanceRecord.watch(['caseStatus', 'idocs:documentStatus'], this.reload);

    this.state = {
      isSmallMode: false,
      fitHeights: {},
      userHeight: UserLocalSettingsService.getDashletHeight(props.id),
      isCollapsed: UserLocalSettingsService.getProperty(props.id, 'isCollapsed')
    };
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
  }

  onResize = width => {
    this.setState({ isSmallMode: isSmallMode(width) });
  };

  render() {
    const { id, title, config, classNameDashlet, classNameContent, record, dragHandleProps, canDragging } = this.props;
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
          className={classNameContent}
          record={record}
          isSmallMode={isSmallMode}
          stateId={id}
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
