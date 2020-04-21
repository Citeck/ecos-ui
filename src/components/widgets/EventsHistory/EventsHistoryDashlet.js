import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { isSmallMode, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import UserLocalSettingsService, { DashletProps } from '../../../services/userLocalSettings';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import EventsHistory from './EventsHistory';

import './style.scss';

class EventsHistoryDashlet extends BaseWidget {
  static propTypes = {
    id: PropTypes.string.isRequired,
    record: PropTypes.string.isRequired,
    title: PropTypes.string,
    classNameContent: PropTypes.string,
    classNameDashlet: PropTypes.string,
    config: PropTypes.shape({
      height: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
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

    this.stateId = getStateId(props);
    this.watcher = this.instanceRecord.watch('cm:modified', this.reload);

    UserLocalSettingsService.checkOldData(props.id);

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

  get fullHeight() {
    return this.state.contentHeight;
  }

  onResize = width => {
    !!width && this.setState({ isSmallMode: isSmallMode(width) });
  };

  render() {
    const { title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, runUpdate, userHeight, fitHeights, isCollapsed } = this.state;

    return (
      <Dashlet
        title={title || t('events-history-widget.title')}
        className={classNames('ecos-event-history-dashlet', classNameDashlet)}
        bodyClassName="ecos-event-history-dashlet__body"
        resizable={true}
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
        <EventsHistory
          {...config}
          forwardedRef={this.contentRef}
          className={classNameContent}
          record={record}
          stateId={this.stateId}
          isSmallMode={isSmallMode}
          runUpdate={runUpdate}
          height={userHeight}
          minHeight={fitHeights.min}
          maxHeight={fitHeights.max}
          getContentHeight={this.setContentHeight}
        />
      </Dashlet>
    );
  }
}

export default EventsHistoryDashlet;
