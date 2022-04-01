import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';

import { isSmallMode, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import DAction from '../../../services/DashletActionService';
import { MAX_DEFAULT_HEIGHT_DASHLET } from '../../../constants';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
//import EventsHistory from './EventsHistory';
import JournalHistory from './JournalHistory';
import EventsHistorySettings from './EventsHistorySettings';

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
    maxHeightByContent: false
  };

  constructor(props) {
    super(props);

    this.stateId = getStateId(props);

    this.state = {
      ...this.state,
      isSmallMode: false,
      isShowSetting: false
    };
  }

  get fullHeight() {
    return this.state.contentHeight;
  }

  get dashletMaxHeight() {
    let height = Math.ceil(this.contentHeight + this.otherHeight);

    if (height > MAX_DEFAULT_HEIGHT_DASHLET) {
      height = MAX_DEFAULT_HEIGHT_DASHLET;
    }

    return height;
  }

  get dashletActions() {
    const { isShowSetting } = this.state;

    if (isShowSetting || !this.props.config) {
      return {};
    }

    return {
      [DAction.Actions.RELOAD]: {
        onClick: this.reload.bind(this)
      },
      [DAction.Actions.SETTINGS]: {
        onClick: this.toggleSettings
      }
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);

    if (!isEqual(prevProps.config, this.props.config)) {
      this.reload();
    }
  }

  onResize = width => {
    !!width && this.setState({ isSmallMode: isSmallMode(width) });
  };

  onSaveConfig = config => {
    isFunction(this.props.onSave) && this.props.onSave(this.props.id, { config });
    this.toggleSettings();
  };

  toggleSettings = () => {
    this.setState(state => ({ isShowSetting: !state.isShowSetting }));
  };

  render() {
    const { title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging } = this.props;
    const { isSmallMode, runUpdate, isCollapsed, isShowSetting } = this.state;

    return (
      <Dashlet
        title={title || t('events-history-widget.title')}
        className={classNames('ecos-event-history-dashlet', classNameDashlet)}
        bodyClassName="ecos-event-history-dashlet__body"
        resizable={true}
        actionConfig={this.dashletActions}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.onResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={isCollapsed}
        setRef={this.setDashletRef}
        contentMaxHeight={this.dashletMaxHeight}
      >
        {isShowSetting && <EventsHistorySettings config={config} onCancel={this.toggleSettings} onSave={this.onSaveConfig} />}
        {/*<EventsHistory*/}
        <JournalHistory
          {...config}
          forwardedRef={this.contentRef}
          className={classNames({ 'd-none': isShowSetting }, classNameContent)}
          record={record}
          stateId={this.stateId}
          isSmallMode={isSmallMode}
          runUpdate={runUpdate}
          maxHeight={MAX_DEFAULT_HEIGHT_DASHLET - this.otherHeight}
          getContentHeight={this.setContentHeight}
          scrollbarProps={this.scrollbarProps}
        />
      </Dashlet>
    );
  }
}

export default EventsHistoryDashlet;
