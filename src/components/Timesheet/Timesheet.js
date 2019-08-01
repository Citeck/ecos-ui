import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import { Collapse } from 'reactstrap';
import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { Input } from '../common/form';
import Hour from './Hour';
import { t, deepClone } from '../../helpers/util';
import './style.scss';

class Timesheet extends Component {
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
      groupsStatuses: {}
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

  getFiltered(eventTypes, filter) {
    return eventTypes.filter(item => item.title.toLowerCase().includes(filter.toLowerCase()));
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

  filterTypes(typeFilter = '') {
    const { eventTypes } = this.props;
    let filteredEventTypes = deepClone(eventTypes);

    if (typeFilter) {
      filteredEventTypes = this.getFiltered(eventTypes, typeFilter);
    }

    this.setState({ typeFilter, filteredEventTypes });
  }

  renderFilter() {
    const { groupBy } = this.props;
    const { typeFilter } = this.state;

    return (
      <div
        className={classNames('ecos-timesheet__table-search', {
          'ecos-timesheet__table-search_groups': groupBy
        })}
      >
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

  renderEventTypes(filteredEventTypes = this.state.filteredEventTypes) {
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

  renderGroupedEvents() {
    const { groupBy, eventTypes } = this.props;

    if (!groupBy) {
      return null;
    }

    return eventTypes.map((item, index) => (
      <div className="ecos-timesheet__table-group" key={`${item.user}-${index}`}>
        <div className="ecos-timesheet__table-events-item ecos-timesheet__table-group-header">
          <div className="ecos-timesheet__table-events-item-dnd" />
          <div
            className={classNames('ecos-timesheet__table-group-collapse', {
              'ecos-timesheet__table-group-collapse_open': this.getGroupStatus(item.user)
            })}
            onClick={this.handleToggleGroupCollapse.bind(null, item.user)}
          />
          <div className="ecos-timesheet__table-group-header-title">{item.user}</div>
        </div>
        <Collapse isOpen={this.getGroupStatus(item.user)}>{this.renderEventTypes(item.eventTypes)}</Collapse>
      </div>
    ));
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
    <div
      className={classNames(
        'ecos-timesheet__table-calendar-cell',
        'ecos-timesheet__table-calendar-cell_hours',
        'ecos-timesheet__table-calendar-cell_big',
        {
          'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay
        }
      )}
    >
      <div className="ecos-timesheet__table-calendar-cell-content">10</div>
    </div>
  );

  renderCells = (items, day) =>
    items.map((item, index) => (
      <div className="ecos-timesheet__table-calendar-cell" key={index}>
        <div className="ecos-timesheet__table-calendar-cell-content">
          <Hour key={`${day.title}-${item.name}-${index}`} color={item.color} count={Math.round(Math.random())} canEdit={item.canEdit} />
        </div>
      </div>
    ));

  renderCalendar() {
    const { daysOfMonth, groupBy, eventTypes } = this.props;
    const { filteredEventTypes } = this.state;

    return (
      <Scrollbars autoHeight autoHeightMin={40} autoHeightMax={'100%'} renderThumbVertical={props => <div {...props} hidden />}>
        <div className="ecos-timesheet__table-calendar">
          {daysOfMonth.map(day => (
            <div className="ecos-timesheet__table-calendar-column" key={day.number}>
              <div
                className={classNames('ecos-timesheet__table-calendar-cell ecos-timesheet__table-calendar-cell_big', {
                  'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay,
                  'ecos-timesheet__table-calendar-cell_by-group': groupBy
                })}
              >
                <div className="ecos-timesheet__table-calendar-cell-content">{day.title}</div>
              </div>
              {!groupBy && this.renderCountByDay(day)}
              {!groupBy && this.renderCells(filteredEventTypes, day)}

              {groupBy &&
                eventTypes.map(item => {
                  return (
                    <React.Fragment>
                      {this.renderCountByDay(day)}
                      {this.renderCells(item.eventTypes, day)}
                    </React.Fragment>
                  );
                })}
            </div>
          ))}
        </div>
      </Scrollbars>
    );
  }

  renderDay = day => {
    return (
      <div key={day.number} className="ecos-timesheet__table-calendar-item">
        <div className="ecos-timesheet__table-calendar-day">{day.title}</div>
      </div>
    );
  };

  render() {
    const { groupBy } = this.props;

    return (
      <div className="ecos-timesheet__table">
        <div className="ecos-timesheet__table-left-column">
          {this.renderFilter()}
          {!groupBy && this.renderEventTypes()}
          {this.renderGroupedEvents()}
        </div>
        <div className="ecos-timesheet__table-right-column">{this.renderCalendar()}</div>
      </div>
    );
  }
}

export default Timesheet;
