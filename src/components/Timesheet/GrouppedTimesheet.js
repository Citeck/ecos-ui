import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import { Collapse } from 'reactstrap';
import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { Input } from '../common/form';
import Hour from './Hour';
import BaseTimesheet from './BaseTimesheet';
import { CalendarRow, CalendarCell, DayCell } from './Calendar';
import { t, deepClone } from '../../helpers/util';
import './style.scss';
import { Tabs } from './index';

const FILTER_BY = {
  PEOPLE: 'user',
  COMPANY: 'organization',
  EVENT: 'event'
};

class GrouppedTimesheet extends BaseTimesheet {
  static propTypes = {
    eventTypes: PropTypes.array,
    daysOfMonth: PropTypes.array,
    groupBy: PropTypes.string
  };

  static defaultProps = {
    eventTypes: [],
    daysOfMonth: [],
    groupBy: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      typeFilter: '',
      filteredEventTypes: deepClone(props.eventTypes),
      groupsStatuses: props.groupBy ? this.initGroupsStatuses(props) : {},
      eventsFilterTabs: [
        {
          name: 'По людям',
          key: FILTER_BY.PEOPLE,
          isActive: true,
          isAvailable: true
        },
        // {
        //   name: 'По событиям',
        //   key: FILTER_BY.EVENT,
        //   isActive: false,
        //   isAvailable: true
        // },
        {
          name: 'По компаниям',
          key: FILTER_BY.COMPANY,
          isActive: false,
          isAvailable: true
        }
      ]
    };
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.groupBy && JSON.stringify(nextProps.eventTypes) !== JSON.stringify(this.props.eventTypes)) {
      this.setState({
        groupsStatuses: this.initGroupsStatuses(nextProps)
      });
    }

    if (JSON.stringify(nextProps.eventTypes) !== JSON.stringify(this.state.eventTypes)) {
      this.setState({
        eventTypes: nextProps.eventTypes,
        filteredEventTypes: deepClone(nextProps.eventTypes)
      });
    }
  }

  initGroupsStatuses(props) {
    return props.eventTypes.map(item => item[props.groupBy]).reduce((result, key, index) => ({ ...result, [key]: !index }), {});
  }

  getFiltered(data, filter) {
    const { eventsFilterTabs } = this.state;
    const activeFilter = eventsFilterTabs.find(item => item.isActive);

    if (activeFilter.key === FILTER_BY.PEOPLE) {
      return data.filter(item => item.user.toLowerCase().includes(filter.toLowerCase()));
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
      return true;
    }

    return groupsStatuses[key];
  }

  handleFilterTypes = event => {
    this.filterTypes(event.target.value);
  };

  handleClearFilterTypes = () => {
    this.filterTypes('');
  };

  handleSortEnd = ({ oldIndex, newIndex }, event) => {
    const { filteredEventTypes } = this.state;
    const eventTypes = deepClone(filteredEventTypes);
    const draggableEvent = eventTypes[oldIndex];

    event.stopPropagation();

    eventTypes.splice(oldIndex, 1);
    eventTypes.splice(newIndex, 0, draggableEvent);

    this.setState({ filteredEventTypes: eventTypes });
  };

  handleSortEndInGroup = (key, { oldIndex, newIndex }, event) => {
    const { filteredEventTypes } = this.state;
    const eventTypes = deepClone(filteredEventTypes);
    const currentEvents = eventTypes[key].eventTypes;
    const draggableEvent = currentEvents[oldIndex];

    event.stopPropagation();

    currentEvents.splice(oldIndex, 1);
    currentEvents.splice(newIndex, 0, draggableEvent);

    this.setState({ filteredEventTypes: eventTypes });
  };

  handleToggleGroupCollapse = (key, event) => {
    event.stopPropagation();

    this.setState(state => {
      const groupsStatuses = deepClone(state.groupsStatuses);

      if (groupsStatuses[key] === undefined) {
        groupsStatuses[key] = true;
      }

      groupsStatuses[key] = !groupsStatuses[key];

      return { groupsStatuses };
    });
  };

  handleChangeActiveFilterType = tabIndex => {
    const eventsFilterTabs = deepClone(this.state.eventsFilterTabs);

    eventsFilterTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ eventsFilterTabs }, () => this.filterTypes(this.state.typeFilter));
  };

  filterTypes(typeFilter = '') {
    const { eventTypes } = this.props;
    let filteredEventTypes = deepClone(eventTypes);

    if (typeFilter) {
      filteredEventTypes = this.getFiltered(eventTypes, typeFilter);
    }

    this.setState({ typeFilter, filteredEventTypes });
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
            placeholder={t('Найти сотрудника')}
            value={typeFilter}
            onChange={this.handleFilterTypes}
          />

          {typeFilter && <div className="ecos-timesheet__table-search-input-clear" onClick={this.handleClearFilterTypes} />}
        </div>
      </div>
    );
  }

  renderEventTypes(eventTypes = this.state.filteredEventTypes, key = null) {
    return (
      <SortableContainer
        axis="y"
        lockAxis="y"
        onSortEnd={key === null ? this.handleSortEnd : this.handleSortEndInGroup.bind(this, key)}
        // updateBeforeSortStart={this.handleBeforeSortStart}
        useDragHandle
      >
        <div className="ecos-timesheet__table-events">{eventTypes.map(this.renderEventType)}</div>
      </SortableContainer>
    );
  }

  renderGroupedEvents() {
    const { groupBy, eventTypes } = this.props;
    const { filteredEventTypes } = this.state;

    if (!groupBy) {
      return null;
    }

    return (
      <SortableContainer
        axis="y"
        lockAxis="y"
        onSortEnd={this.handleSortEnd}
        // updateBeforeSortStart={this.handleBeforeSortStart}
        useDragHandle
      >
        <div>
          {filteredEventTypes.map((item, index) => (
            <SortableElement key={`${item.user}-${index}`} index={index}>
              <div className="ecos-timesheet__table-group">
                <div className="ecos-timesheet__table-events-item ecos-timesheet__table-group-header">
                  <SortableHandle>
                    <div className="ecos-timesheet__table-events-item-dnd" />
                  </SortableHandle>

                  <div
                    className={classNames('ecos-timesheet__table-group-collapse', {
                      'ecos-timesheet__table-group-collapse_open': this.getGroupStatus(item.user)
                    })}
                    onClick={this.handleToggleGroupCollapse.bind(null, item.user)}
                  />
                  <div className="ecos-timesheet__table-group-header-title">{item.user}</div>
                </div>
                <Collapse isOpen={this.getGroupStatus(item.user)}>{this.renderEventTypes(item.eventTypes, index)}</Collapse>
              </div>
            </SortableElement>
          ))}
        </div>
      </SortableContainer>
    );
  }

  renderEventType = (item, position) => {
    return (
      <SortableElement key={position} index={position}>
        <div className="ecos-timesheet__table-events-item">
          <SortableHandle>
            <div className="ecos-timesheet__table-events-item-dnd" />
          </SortableHandle>

          <div className="ecos-timesheet__table-events-item-filter" style={{ backgroundColor: item.color || '#D0D0D0' }} />
          <div className="ecos-timesheet__table-events-item-title">{item.title}</div>
          <div className="ecos-timesheet__table-events-item-add-btn" />
        </div>
      </SortableElement>
    );
  };

  renderCountByDay = day => (
    <DayCell day={day} key={day.title}>
      10
    </DayCell>
  );

  renderCells = (items, day) =>
    items.map((item, index) => (
      <CalendarCell key={index}>
        <Hour key={`${day.title}-${item.name}-${index}`} color={item.color} count={Math.round(Math.random())} canEdit={item.canEdit} />
      </CalendarCell>
    ));

  renderCalendarHeader() {
    const { daysOfMonth } = this.props;

    return (
      <CalendarRow key="date">
        {daysOfMonth.map(day => (
          <CalendarCell
            className={classNames(
              'ecos-timesheet__table-calendar-cell_day',
              'ecos-timesheet__table-calendar-cell_big',
              'ecos-timesheet__table-calendar-cell_by-group',
              {
                'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay
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
    const { daysOfMonth, groupBy } = this.props;
    const { filteredEventTypes } = this.state;

    if (!groupBy) {
      return filteredEventTypes.map(this.renderEventCalendarRow);
    }

    return filteredEventTypes.map((event, eventIndex) => {
      return [
        <CalendarRow key={`hours-${eventIndex}`}>{daysOfMonth.map(this.renderCountByDay)}</CalendarRow>,
        <Collapse
          className="ecos-timesheet__table-group-collapse-wrapper"
          isOpen={this.getGroupStatus(event[groupBy])}
          key={`group-${event[groupBy]}-${eventIndex}`}
        >
          {event.eventTypes.map(this.renderEventCalendarRow)}
        </Collapse>
      ];
    });
  }

  renderEventCalendarRow = (event, eventIndex) => (
    <CalendarRow key={eventIndex}>
      {this.props.daysOfMonth.map((day, dayIndex) => (
        <CalendarCell key={dayIndex}>
          <Hour
            key={`${eventIndex}-${event.name}-${day.title}-${dayIndex}`}
            color={event.color}
            count={Math.round(Math.random())}
            canEdit={event.canEdit}
          />
        </CalendarCell>
      ))}
    </CalendarRow>
  );

  renderCalendar() {
    return (
      <Scrollbars autoHeight autoHeightMin={40} autoHeightMax={'100%'} renderThumbVertical={props => <div {...props} hidden />}>
        <div className="ecos-timesheet__table-calendar">
          {this.renderCalendarHeader()}
          {this.renderEvents()}
        </div>
      </Scrollbars>
    );
  }

  render() {
    return (
      <div className="ecos-timesheet__table">
        <div className="ecos-timesheet__table-left-column">
          {this.renderFilter()}
          {this.renderGroupedEvents()}
        </div>
        <div className="ecos-timesheet__table-right-column">{this.renderCalendar()}</div>
      </div>
    );
  }
}

export default GrouppedTimesheet;
