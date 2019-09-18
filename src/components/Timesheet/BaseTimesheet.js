import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import { UncontrolledTooltip } from 'reactstrap';
import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { Input } from '../common/form';
import Hour from './Hour';
import Tooltip from './Tooltip';
import { CalendarRow, CalendarCell, Header } from './Calendar';
import { t, deepClone } from '../../helpers/util';
import './style.scss';

class BaseTimesheet extends Component {
  static propTypes = {
    eventTypes: PropTypes.array,
    daysOfMonth: PropTypes.array,
    isAvailable: PropTypes.bool
  };

  static defaultProps = {
    isAvailable: true,
    eventTypes: [],
    daysOfMonth: []
  };

  constructor(props) {
    super(props);

    this.state = {
      typeFilter: '',
      filteredEventTypes: deepClone(props.eventTypes),
      isOpen: false,
      draggableNode: null
    };

    this._scrollbar = React.createRef();
    this._calendarWrapper = React.createRef();
  }

  componentDidMount() {
    if (this._calendarWrapper.current) {
      this._calendarWrapper.current.addEventListener('wheel', this.handleWheelCalendar, { passive: false });
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (JSON.stringify(nextProps.eventTypes) !== JSON.stringify(this.state.eventTypes)) {
      this.setState({
        eventTypes: nextProps.eventTypes,
        filteredEventTypes: deepClone(nextProps.eventTypes)
      });
    }
  }

  componentWillUnmount() {
    if (this._calendarWrapper.current) {
      this._calendarWrapper.current.removeEventListener('wheel', this.handleWheelCalendar);
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
    const { filteredEventTypes, draggableNode } = this.state;
    const eventTypes = deepClone(filteredEventTypes);
    const draggableEvent = eventTypes[oldIndex];

    event.stopPropagation();
    draggableNode.classList.toggle('ecos-timesheet__table-events-item_sorting');

    eventTypes.splice(oldIndex, 1);
    eventTypes.splice(newIndex, 0, draggableEvent);

    this.setState({ filteredEventTypes: eventTypes, draggableNode: null });
  };

  handleWheelCalendar = event => {
    event.stopPropagation();
    event.preventDefault();

    const { current } = this._scrollbar;

    if (!current) {
      return;
    }

    const currentScrollDelta = current.getScrollLeft();

    current.scrollLeft(currentScrollDelta + event.deltaY);
  };

  handleBeforeSortStart = ({ node }) => {
    node.classList.toggle('ecos-timesheet__table-events-item_sorting');

    this.setState({ draggableNode: node });
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

  renderEventTypes() {
    const { filteredEventTypes } = this.state;

    return (
      <SortableContainer
        axis="y"
        lockAxis="y"
        onSortEnd={this.handleSortEnd}
        updateBeforeSortStart={this.handleBeforeSortStart}
        useDragHandle
      >
        <div className="ecos-timesheet__table-events">{filteredEventTypes.map(this.renderEventType)}</div>
      </SortableContainer>
    );
  }

  renderEventType = (item, position) => (
    <SortableElement key={item.title} index={position}>
      <div className="ecos-timesheet__table-events-item">
        <SortableHandle>
          <div className="ecos-timesheet__table-events-item-dnd" />
        </SortableHandle>

        <div className="ecos-timesheet__table-events-item-filter" style={{ backgroundColor: item.color || '#D0D0D0' }} />
        <div className="ecos-timesheet__table-events-item-title">{item.title}</div>
        <div className="ecos-timesheet__table-events-item-add-btn" id={`event-type-${position}`} />
        <Tooltip target={`event-type-${position}`} content={t('Добавить дни')} />
      </div>
    </SortableElement>
  );

  renderCountByDay = day => (
    <CalendarCell
      key={day.title}
      className={classNames('ecos-timesheet__table-calendar-cell_hours', 'ecos-timesheet__table-calendar-cell_big', {
        'ecos-timesheet__table-calendar-cell_weekend': !day.isBusinessDay
      })}
    >
      10
    </CalendarCell>
  );

  renderTooltip = (title, id) => <UncontrolledTooltip target={id}>{title}</UncontrolledTooltip>;

  renderCalendarHeader() {
    const { daysOfMonth } = this.props;

    return (
      <>
        <Header key="header-date" daysOfMonth={daysOfMonth} />
        <CalendarRow key="hours">{daysOfMonth.map(this.renderCountByDay)}</CalendarRow>
      </>
    );
  }

  renderEvents() {
    const { filteredEventTypes } = this.state;

    return filteredEventTypes.map(this.renderEventCalendarRow);
  }

  renderEventCalendarRow = eventItem => (
    <CalendarRow key={`calendar-row-${eventItem.name}`}>
      {this.props.daysOfMonth.map(day => (
        <CalendarCell key={`calendar-cell-${day.number}`}>
          <Hour color={eventItem.color} count={eventItem.name == 'daytime-work' && day.isBusinessDay ? 8 : 0} canEdit={eventItem.canEdit} />
        </CalendarCell>
      ))}
    </CalendarRow>
  );

  renderCalendar() {
    const { isAvailable } = this.props;

    return (
      <Scrollbars
        autoHeight
        autoHeightMin={40}
        autoHeightMax={'100%'}
        renderThumbVertical={props => <div {...props} hidden />}
        ref={this._scrollbar}
      >
        <div
          className={classNames('ecos-timesheet__table-calendar', {
            'ecos-timesheet__table-calendar_not-available': !isAvailable
          })}
        >
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
        <div className="ecos-timesheet__table-right-column" ref={this._calendarWrapper}>
          {this.renderCalendar()}
        </div>
      </div>
    );
  }
}

export default BaseTimesheet;
