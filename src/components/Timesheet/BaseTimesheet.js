import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { Input } from '../common/form';
import Hour from './Hour';
import { CalendarRow, CalendarCell, DayCell } from './Calendar';
// import DayCell from './DayCell';
import { t, deepClone } from '../../helpers/util';
import './style.scss';

class BaseTimesheet extends Component {
  static propTypes = {
    eventTypes: PropTypes.array,
    daysOfMonth: PropTypes.array
  };

  static defaultProps = {
    eventTypes: [],
    daysOfMonth: []
  };

  constructor(props) {
    super(props);

    this.state = {
      typeFilter: '',
      filteredEventTypes: deepClone(props.eventTypes)
    };
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (JSON.stringify(nextProps.eventTypes) !== JSON.stringify(this.state.eventTypes)) {
      this.setState({
        eventTypes: nextProps.eventTypes,
        filteredEventTypes: deepClone(nextProps.eventTypes)
      });
    }
  }

  getFiltered(eventTypes, filter) {
    return eventTypes.filter(item => item.title.toLowerCase().includes(filter.toLowerCase()));
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

  filterTypes(typeFilter = '') {
    const { eventTypes } = this.props;
    let filteredEventTypes = deepClone(eventTypes);

    if (typeFilter) {
      filteredEventTypes = this.getFiltered(eventTypes, typeFilter);
    }

    this.setState({ typeFilter, filteredEventTypes });
  }

  renderFilter() {
    const { typeFilter } = this.state;

    return (
      <div className={classNames('ecos-timesheet__table-search')}>
        <div className="ecos-timesheet__table-search-input">
          <Input
            className="ecos-timesheet__table-search-input-field"
            placeholder={t('Найти событие')}
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

  renderCalendarHeader() {
    const { daysOfMonth } = this.props;

    return [
      <CalendarRow key="date">
        {daysOfMonth.map(day => (
          <DayCell day={day} key={day.title}>
            {day.title}
          </DayCell>
        ))}
      </CalendarRow>,
      <CalendarRow key="hours">{daysOfMonth.map(this.renderCountByDay)}</CalendarRow>
    ];
  }

  renderEvents() {
    const { filteredEventTypes } = this.state;

    return filteredEventTypes.map(this.renderEventCalendarRow);
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
          {this.renderEventTypes()}
        </div>
        <div className="ecos-timesheet__table-right-column">{this.renderCalendar()}</div>
      </div>
    );
  }
}

export default BaseTimesheet;
