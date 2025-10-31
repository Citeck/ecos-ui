import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';

import { MAX_DEFAULT_HEIGHT_DASHLET } from '../../../constants';
import { getStateId } from '../../../helpers/store';
import { isSmallMode, t } from '../../../helpers/util';
import DAction from '../../../services/DashletActionService';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';

import EventsHistorySettings from './EventsHistorySettings';
import JournalHistory from './JournalHistory';
import { Labels } from './util';

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
      isShowSetting: false,
      runCleanFilters: false
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
      'clean-filters': {
        icon: 'icon-filter-clean',
        text: t(Labels.ACT_CLEAN_FILTER),
        onClick: this.handleCleanFilters
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

  handleResize = width => {
    !!width && this.setState({ isSmallMode: isSmallMode(width) });
  };

  handleSaveConfig = config => {
    isFunction(this.props.onSave) && this.props.onSave(this.props.id, { config });
    this.toggleSettings();
  };

  toggleSettings = () => {
    this.setState(state => ({ isShowSetting: !state.isShowSetting }));
  };

  handleCleanFilters = () => {
    this.setState({ runCleanFilters: true }, () => this.setState({ runCleanFilters: false }));
  };

  render() {
    const { title, config, classNameContent, classNameDashlet, record, dragHandleProps, canDragging, ...props } = this.props;
    const { isSmallMode, isShowSetting, runUpdate, runCleanFilters } = this.state;

    return (
      <Dashlet
        {...props}
        title={title || t(Labels.WIDGET_TITLE)}
        className={classNames('ecos-event-history-dashlet', classNameDashlet)}
        bodyClassName="ecos-event-history-dashlet__body"
        resizable={true}
        actionConfig={this.dashletActions}
        needGoTo={false}
        canDragging={canDragging}
        dragHandleProps={dragHandleProps}
        onChangeHeight={this.handleChangeHeight}
        getFitHeights={this.setFitHeights}
        onResize={this.handleResize}
        onToggleCollapse={this.handleToggleContent}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
        contentMaxHeight={this.dashletMaxHeight}
      >
        {isShowSetting && <EventsHistorySettings config={config} onCancel={this.toggleSettings} onSave={this.handleSaveConfig} />}
        <JournalHistory
          {...config}
          forwardedRef={this.contentRef}
          className={classNames({ 'd-none': isShowSetting }, classNameContent)}
          record={record}
          stateId={this.stateId}
          isSmallMode={isSmallMode}
          runUpdate={runUpdate}
          runCleanFilters={runCleanFilters}
          maxHeight={MAX_DEFAULT_HEIGHT_DASHLET - this.otherHeight}
          getContentHeight={this.setContentHeight}
          scrollbarProps={this.scrollbarProps}
        />
      </Dashlet>
    );
  }
}

export default EventsHistoryDashlet;
