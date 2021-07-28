import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import isFunction from 'lodash/isFunction';
import get from 'lodash/get';

import { t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';

import { Icon, Loader, ResizeBoxes } from '../common';
import { Input } from '../common/form';
import { Btn, IcoBtn } from '../common/btns';
import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { CalendarCell, CalendarRow, Collapse, Header } from './Calendar';
import BaseTimesheet from './BaseTimesheet';
import Tabs from './Tabs';
import Tooltip from './Tooltip';
import EventHistoryModal from './EventHistoryModal';

import './style.scss';

const FILTER_BY = {
  PEOPLE: 'user',
  COMPANY: 'organization',
  EVENT: 'event'
};

const initEventHistory = {
  isOpen: false,
  record: '',
  comment: ''
};

class GrouppedTimesheet extends BaseTimesheet {
  static propTypes = {
    eventTypes: PropTypes.array,
    daysOfMonth: PropTypes.array,
    groupBy: PropTypes.string,
    loadingOnTimesheet: PropTypes.string,
    configGroupBtns: PropTypes.array,
    updatingHours: PropTypes.object,
    onChangeHours: PropTypes.func
  };

  static defaultProps = {
    eventTypes: [],
    daysOfMonth: [],
    groupBy: ''
  };

  #leftId = uniqueId('tableLeftColumn_');
  #rightId = uniqueId('tableRightColumn_');

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      typeFilter: '',
      filteredEventTypes: cloneDeep(props.eventTypes),
      groupsStatuses: this.initGroupsStatuses(props.eventTypes, props.groupBy) || {},
      eventsFilterTabs: [
        {
          name: t(CommonLabels.FILTER_BY_PEOPLE),
          key: FILTER_BY.PEOPLE,
          isActive: true,
          isAvailable: true
        },
        // {
        //   name: t(CommonLabels.FILTER_BY_EVENTS),
        //   key: FILTER_BY.EVENT,
        //   isActive: false,
        //   isAvailable: true
        // },
        {
          name: t(CommonLabels.FILTER_BY_COMPANIES),
          key: FILTER_BY.COMPANY,
          isActive: false,
          isAvailable: true
        }
      ],
      draggableNode: null,
      eventHistory: initEventHistory
    };
  }

  componentWillReceiveProps(nextProps, nextContext) {}

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { eventTypes, groupBy, onGetCalendarEvents } = this.props;
    const { typeFilter, groupsStatuses } = this.state;
    const nextState = {};

    if (!isEqual(prevProps.eventTypes, eventTypes)) {
      const filteredEventTypes = typeFilter !== '' ? this.getFiltered(cloneDeep(eventTypes), typeFilter) : cloneDeep(eventTypes);
      const nextGroupStatuses = this.initGroupsStatuses(filteredEventTypes, groupBy);
      const nextGroupsKeys = Object.keys(nextGroupStatuses);
      const currentGroupsKeys = Object.keys(groupsStatuses);

      nextState.filteredEventTypes = filteredEventTypes;

      if (!isEqual(currentGroupsKeys, nextGroupsKeys)) {
        const userName = get(filteredEventTypes, '0.userName');

        if (groupsStatuses[userName] === undefined) {
          if (isFunction(onGetCalendarEvents)) {
            onGetCalendarEvents(userName);
          }
        }

        nextState.groupsStatuses = nextGroupStatuses;
      }
    }

    if (!isEmpty(nextState)) {
      this.setState({ ...nextState });
    }
  }

  initGroupsStatuses(eventTypes, groupBy) {
    return eventTypes
      .map(item => item[groupBy])
      .reduce(
        (result, key, index) => ({
          ...result,
          [key]: index === 0 || undefined
        }),
        {}
      );
  }

  getFiltered(data, filter) {
    const { eventsFilterTabs } = this.state;
    const activeFilter = eventsFilterTabs.find(item => item.isActive);

    if (activeFilter.key === FILTER_BY.PEOPLE) {
      return data.filter(
        item => item.user.toLowerCase().includes(filter.toLowerCase()) || item.userName.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (activeFilter.key === FILTER_BY.COMPANY) {
      return data.filter(item => item.organization.toLowerCase().includes(filter.toLowerCase()));
    }

    if (activeFilter.key === FILTER_BY.EVENT) {
      return data.map(item => ({
        ...item,
        eventTypes: item.eventTypes.filter(event => event.title.toLowerCase().includes(filter.toLowerCase()))
      }));
    }

    return data;
  }

  getGroupStatus(key) {
    const { groupsStatuses } = this.state;

    if (groupsStatuses[key] === undefined) {
      return false;
    }

    return groupsStatuses[key];
  }

  handleFilterTypes = event => {
    this.filterTypes(event.target.value);
  };

  handleClearFilterTypes = () => {
    this.filterTypes('');
  };

  handleSortEndInGroup = (key, { oldIndex, newIndex }, event) => {
    const { filteredEventTypes, draggableNode } = this.state;
    const eventTypes = [...filteredEventTypes];
    const currentEvents = eventTypes[key].eventTypes;
    const draggableEvent = currentEvents[oldIndex];

    event.stopPropagation();
    draggableNode.classList.toggle('ecos-timesheet__table-events-item_sorting');

    currentEvents.splice(oldIndex, 1);
    currentEvents.splice(newIndex, 0, draggableEvent);

    this.setState({ filteredEventTypes: eventTypes, draggableNode: null });
  };

  handleToggleGroupCollapse = (group, event) => {
    const { groupBy, onGetCalendarEvents } = this.props;
    const key = group[groupBy];

    event.stopPropagation();

    this.setState(state => {
      const { groupsStatuses } = state;

      if (groupsStatuses[key] === undefined) {
        groupsStatuses[key] = false;

        if (isFunction(onGetCalendarEvents)) {
          onGetCalendarEvents(group.userName);
        }
      }

      groupsStatuses[key] = !groupsStatuses[key];

      return { groupsStatuses };
    });
  };

  handleChangeActiveFilterType = tabIndex => {
    const eventsFilterTabs = cloneDeep(this.state.eventsFilterTabs);

    eventsFilterTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ eventsFilterTabs }, () => this.filterTypes(this.state.typeFilter));
  };

  handleOpenEventHistory = item => {
    this.setState({ eventHistory: { isOpen: true, record: item.nodeRef, comment: '' } });
  };

  handleCloseEventHistory = () => {
    this.setState({ eventHistory: initEventHistory });
  };

  filterTypes(typeFilter = '') {
    const { eventTypes, groupBy, onGetCalendarEvents } = this.props;
    let filteredEventTypes = cloneDeep(eventTypes);
    let groupsStatuses = this.initGroupsStatuses(eventTypes, groupBy);

    if (!isEqual(typeFilter, this.state.typeFilter)) {
      filteredEventTypes = this.getFiltered(filteredEventTypes, typeFilter);

      const userName = get(filteredEventTypes, '0.userName');

      if (groupsStatuses[userName] === undefined) {
        if (isFunction(onGetCalendarEvents)) {
          onGetCalendarEvents(userName);
        }
      }

      groupsStatuses = this.initGroupsStatuses(filteredEventTypes, groupBy);
    }

    this.setState({ typeFilter, filteredEventTypes, groupsStatuses });
  }

  renderFilter() {
    const { typeFilter, eventsFilterTabs } = this.state;

    return (
      <div className={classNames('ecos-timesheet__table-search ecos-timesheet__table-search_groups')}>
        <Tabs
          tabs={eventsFilterTabs}
          isSmall
          onClick={this.handleChangeActiveFilterType}
          classNameItem="ecos-timesheet__table-search-tabs-item"
        />

        <div className="ecos-timesheet__table-search-input">
          <Input
            className="ecos-timesheet__table-search-input-field"
            placeholder={t(CommonLabels.FIND_EMPLOYEE_TIP)}
            value={typeFilter}
            onChange={this.handleFilterTypes}
          />
          {typeFilter && (
            <Icon className="icon-small-close ecos-timesheet__table-search-input-clear" onClick={this.handleClearFilterTypes} />
          )}
        </div>
      </div>
    );
  }

  renderEventsGroup(group, key = null) {
    return (
      <SortableContainer
        axis="y"
        lockAxis="y"
        onSortEnd={this.handleSortEndInGroup.bind(this, key)}
        updateBeforeSortStart={this.handleBeforeSortStart}
        useDragHandle
      >
        <div className="ecos-timesheet__table-events">
          {group.map((item, index) => (
            <this.renderEventType key={item.name} item={item} position={index} groupPosition={key} />
          ))}
        </div>
      </SortableContainer>
    );
  }

  renderEventHistoryBtn(index, item) {
    const hasComment = item.comment;

    return (
      <>
        <Icon
          id={`timesheet-group-${index}-history`}
          className={classNames({
            'icon-history ecos-timesheet__table-group-header-history': !hasComment,
            'icon-notify ecos-timesheet__table-group-header-message': hasComment
          })}
          onClick={() => this.handleOpenEventHistory(item)}
        />
        <Tooltip
          target={`timesheet-group-${index}-history`}
          content={hasComment ? t(CommonLabels.SHOW_COMMENT_TIP) : t(CommonLabels.SHOW_EVEN_HISTORY_TIP)}
          innerClassName="ecos-timesheet__table-group-tooltip"
        />
      </>
    );
  }

  renderGroupBtnByConfig(index) {
    const { configGroupBtns } = this.props;

    return configGroupBtns.map(config => {
      const Button = config.icon ? IcoBtn : Btn;

      const attr = {
        className: classNames('ecos-btn_grey8 ecos-btn_narrow', config.className || ''),
        onClick: () => {
          const data = this.state.filteredEventTypes[index];
          config.onClick(data);
        },
        id: uniqueId(`${config.id || 'ecos-timesheet-btn'}-${index}-`)
      };

      if (config.icon) {
        attr.icon = config.icon;
      }

      if (!config.onClick) {
        return <div key={attr.id} className="ecos-timesheet__empty-btn ecos-timesheet__empty-btn_narrow" />;
      }

      return (
        <React.Fragment key={attr.id}>
          <Button {...attr}>{config.title}</Button>
          {config.tooltip && <Tooltip target={attr.id} content={config.tooltip} innerClassName="ecos-timesheet__table-group-tooltip" />}
        </React.Fragment>
      );
    });
  }

  renderItem = React.memo(({ item, index, onToggle, isOpen }) => (
    <SortableElement index={index}>
      <div className="ecos-timesheet__table-group">
        <div className="ecos-timesheet__table-group-header">
          <div className="ecos-timesheet__table-group-line">
            <div className="ecos-timesheet__table-group-name">
              <SortableHandle>
                <Icon className="icon-custom-drag-big ecos-timesheet__table-group-header-dnd" />
              </SortableHandle>

              <Icon
                className={classNames('icon-small-down ecos-timesheet__table-group-collapse', {
                  'ecos-timesheet__table-group-collapse_open': isOpen
                })}
                data-key={item.user}
                onClick={onToggle}
              />

              <div className="ecos-timesheet__table-group-header-title">{item.user}</div>
            </div>

            <div className="ecos-timesheet__table-group-number">
              {this.renderEventHistoryBtn(index, item)}
              <div className="ecos-timesheet__table-group-header-badge">{item.timesheetNumber}</div>
            </div>
          </div>

          <div className="ecos-timesheet__table-group-line ecos-timesheet__table-group-line_space-between ">
            {this.renderGroupBtnByConfig(index)}
          </div>
        </div>

        <Collapse isOpen={isOpen} transition="height 250ms linear 0s">
          {this.renderEventsGroup(item.eventTypes, index)}
        </Collapse>
      </div>
    </SortableElement>
  ));

  renderGroupedEvents() {
    const { groupBy } = this.props;
    const { filteredEventTypes } = this.state;

    return (
      <SortableContainer
        axis="y"
        lockAxis="y"
        onSortEnd={this.handleSortEnd}
        updateBeforeSortStart={this.handleBeforeSortStart}
        useDragHandle
      >
        <div>
          {filteredEventTypes.map((item, index) => (
            <this.renderItem
              key={item.timesheetNumber}
              item={item}
              groupBy={groupBy}
              index={index}
              isOpen={this.getGroupStatus(item[groupBy])}
              onToggle={e => this.handleToggleGroupCollapse(item, e)}
            />
          ))}
        </div>
      </SortableContainer>
    );
  }

  renderCountByDay = day => (
    <CalendarCell
      key={day.title}
      className={classNames('ecos-timesheet__table-calendar-cell_hours', 'ecos-timesheet__table-calendar-cell_group-item', {
        'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay
      })}
    />
  );

  renderCalendarHeader() {
    const { daysOfMonth } = this.props;

    return (
      <CalendarRow key="date">
        {daysOfMonth.map(day => (
          <CalendarCell
            key={`header-date-${day.title}`}
            className={classNames(
              'ecos-timesheet__table-calendar-cell_day',
              'ecos-timesheet__table-calendar-cell_big',
              'ecos-timesheet__table-calendar-cell_by-group',
              {
                'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay,
                'ecos-timesheet__table-calendar-cell_current': day.isCurrentDay
              }
            )}
          >
            {day.title}
          </CalendarCell>
        ))}
      </CalendarRow>
    );
  }

  renderEvents() {
    const { daysOfMonth, groupBy, loadingOnTimesheet, updatingHours } = this.props;
    const { filteredEventTypes } = this.state;

    return filteredEventTypes.map((item, index) => (
      <div key={`event-${item.userName}-${index}`} className="position-relative">
        <CalendarRow>{daysOfMonth.map(this.renderCountByDay)}</CalendarRow>
        {loadingOnTimesheet === item.userName && <Loader darkened blur />}
        {this.getGroupStatus(item[groupBy]) && (
          <Collapse transition="height 250ms linear 0s" className="ecos-timesheet__table-group-collapse-wrapper" isOpen>
            {item.eventTypes.map(event => (
              <this.renderEventCalendarRow
                key={`${item.userName}-${event.name}`}
                eventItem={event}
                userName={item.userName}
                daysOfMonth={daysOfMonth}
                updatingHours={updatingHours}
                onChange={this.handleChangeEventHours}
                onReset={this.handleResetEventHours}
              />
            ))}
          </Collapse>
        )}
      </div>
    ));
  }

  renderCalendar() {
    const { daysOfMonth } = this.props;

    return (
      <Scrollbars
        autoHeight
        autoHeightMin={40}
        autoHeightMax={'100%'}
        renderThumbVertical={props => <div {...props} hidden />}
        ref={this._scrollbar}
      >
        <div className="ecos-timesheet__table-calendar">
          <Header daysOfMonth={daysOfMonth} byGroup />
          {this.renderEvents()}
        </div>
      </Scrollbars>
    );
  }

  renderEventHistoryModal() {
    const { eventHistory = {} } = this.state;

    return (
      <EventHistoryModal
        onClose={this.handleCloseEventHistory}
        isOpen={eventHistory.isOpen}
        record={eventHistory.record}
        comment={eventHistory.comment}
      />
    );
  }

  render() {
    const { filteredEventTypes } = this.state;

    return (
      <>
        <div className="ecos-timesheet__table">
          <div className="ecos-timesheet__table-left-column" id={this.#leftId}>
            {this.renderFilter()}
            {this.renderGroupedEvents()}
            <ResizeBoxes className="ecos-timesheet__resizer" leftId={this.#leftId} rightId={this.#rightId} />
          </div>
          <div className="ecos-timesheet__table-right-column" ref={this._calendarWrapper} id={this.#rightId}>
            {this.renderCalendar()}
          </div>
          {this.renderLock()}
        </div>
        {isEmpty(filteredEventTypes) && this.renderNoData()}
        {this.renderEventHistoryModal()}
      </>
    );
  }
}

export default GrouppedTimesheet;
