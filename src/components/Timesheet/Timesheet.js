import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';

import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { Input } from '../common/form';
import Hour from './Hour';
import { t, deepClone } from '../../helpers/util';
import './style.scss';

class Timesheet extends Component {
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

  static getDerivedStateFromProps(props, state) {
    if (JSON.stringify(props.eventTypes) !== JSON.stringify(state.eventTypes)) {
      return {
        eventTypes: props.eventTypes,
        filteredEventTypes: deepClone(props.eventTypes)
      };
    }

    return null;
  }

  handleFilterTypes = event => {
    this.filterTypes(event.target.value);
  };

  handleClearFilterTypes = () => {
    this.filterTypes('');
  };

  getFiltered(eventTypes, filter) {
    return eventTypes.filter(item => item.title.toLowerCase().includes(filter.toLowerCase()));
  }

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
      <div className="ecos-timesheet__table-search">
        <Input
          className="ecos-timesheet__table-search-input"
          placeholder={t('Найти событие')}
          value={typeFilter}
          onChange={this.handleFilterTypes}
        />

        {typeFilter && <div className="ecos-timesheet__table-search-clear" onClick={this.handleClearFilterTypes} />}
      </div>
    );
  }

  renderEventTypes() {
    const { filteredEventTypes } = this.state;

    return (
      <SortableContainer
        axis="y"
        lockAxis="y"
        onSortEnd={this.handleSortEnd}
        // updateBeforeSortStart={this.handleBeforeSortStart}
        useDragHandle
      >
        <div className="ecos-timesheet__table-events">{filteredEventTypes.map(this.renderEventType)}</div>
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

  renderCalendar() {
    const { daysOfMonth } = this.props;
    const { filteredEventTypes } = this.state;
    const days = [];

    for (let i = 0; i < daysOfMonth.length; i++) {
      days.push(this.renderDay({ key: i, title: daysOfMonth[i] }));
    }

    return (
      <Scrollbars autoHeight autoHeightMin={40} autoHeightMax={'100%'} renderThumbVertical={props => <div {...props} hidden />}>
        <div className="ecos-timesheet__table-calendar">
          {daysOfMonth.map(day => (
            <div className="ecos-timesheet__table-calendar-column" key={day}>
              <div className="ecos-timesheet__table-calendar-cell ecos-timesheet__table-calendar-cell_big">
                <div className="ecos-timesheet__table-calendar-cell-content">{day}</div>
              </div>
              <div className="ecos-timesheet__table-calendar-cell ecos-timesheet__table-calendar-cell_hours ecos-timesheet__table-calendar-cell_big">
                <div className="ecos-timesheet__table-calendar-cell-content">10</div>
              </div>

              {filteredEventTypes.map((item, index) => (
                <div className="ecos-timesheet__table-calendar-cell" key={index}>
                  <div className="ecos-timesheet__table-calendar-cell-content">
                    <Hour
                      key={`${day}-${item.name}-${index}`}
                      color={item.color}
                      count={Math.round(Math.random())}
                      canEdit={item.canEdit}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Scrollbars>
    );
  }

  renderDay = day => {
    return (
      <div key={day.key} className="ecos-timesheet__table-calendar-item">
        <div className="ecos-timesheet__table-calendar-day">{day.title}</div>
      </div>
    );
  };

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

export default Timesheet;
