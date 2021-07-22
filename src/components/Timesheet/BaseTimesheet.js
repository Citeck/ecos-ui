import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import cloneDeep from 'lodash/cloneDeep';
import { Scrollbars } from 'react-custom-scrollbars';

import { t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import CommonTimesheetService from '../../services/timesheet/common';

import { Icon, ResizeBoxes } from '../common';
import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { Input } from '../common/form';
import Hour from './Hour';
import Tooltip from './Tooltip';
import { CalendarCell, CalendarRow, Header } from './Calendar';
import { ServerEventTypes } from '../../constants/timesheet';

import './style.scss';

class BaseTimesheet extends Component {
  static propTypes = {
    eventTypes: PropTypes.array,
    daysOfMonth: PropTypes.array,
    isAvailable: PropTypes.bool,
    lockedMessage: PropTypes.string,
    updatingHours: PropTypes.object,
    onChangeHours: PropTypes.func,
    onResetHours: PropTypes.func
  };

  static defaultProps = {
    isAvailable: true,
    eventTypes: [],
    daysOfMonth: [],
    lockedMessage: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      typeFilter: '',
      filteredEventTypes: cloneDeep(props.eventTypes),
      isOpen: false,
      draggableNode: null
    };

    this._scrollbar = React.createRef();
    this._calendarWrapper = React.createRef();
  }

  componentDidMount() {
    if (this._calendarWrapper && this._calendarWrapper.current) {
      this._calendarWrapper.current.addEventListener('wheel', this.handleWheelCalendar, { passive: false });
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (JSON.stringify(nextProps.eventTypes) !== JSON.stringify(this.state.eventTypes)) {
      this.setState({
        eventTypes: nextProps.eventTypes,
        filteredEventTypes: cloneDeep(nextProps.eventTypes)
      });
    }
  }

  componentWillUnmount() {
    if (this._calendarWrapper && this._calendarWrapper.current) {
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
    const eventTypes = cloneDeep(filteredEventTypes);
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

  handleChangeEventHours = (type, number, value, userName) => {
    this.props.onChangeHours && this.props.onChangeHours({ type, number, value, userName });
  };

  handleResetEventHours = (type, number, value, userName) => {
    this.props.onResetHours && this.props.onResetHours({ type, number, value, userName });
  };

  filterTypes(typeFilter = '') {
    const { eventTypes } = this.props;
    let filteredEventTypes = cloneDeep(eventTypes);

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
            placeholder={t(CommonLabels.FIND_EVENT_TIP)}
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
        <div className="ecos-timesheet__table-events">
          {filteredEventTypes.map((item, index) => (
            <this.renderEventType key={item.name} item={item} position={index} />
          ))}
        </div>
      </SortableContainer>
    );
  }

  renderEventType = React.memo(({ item, position, groupPosition = 'none' }) => (
    <SortableElement key={item.title} index={position}>
      <div className="ecos-timesheet__table-events-item">
        <SortableHandle>
          <Icon className="icon-custom-drag-big ecos-timesheet__table-events-item-dnd" />
        </SortableHandle>

        <div className="ecos-timesheet__table-events-item-filter" style={{ backgroundColor: item.color || '#D0D0D0' }} />
        <div className="ecos-timesheet__table-events-item-title">{item.title}</div>

        {/*<Icon className="icon-small-plus ecos-timesheet__table-events-item-add-btn" id={`event-type-${position}-group-${groupPosition}`} />*/}
        {/*<Tooltip target={`event-type-${position}-group-${groupPosition}`} content={t(CommonLabels.ADD_DAYS)} />*/}
      </div>
    </SortableElement>
  ));

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

  renderCalendarHeader() {
    const { daysOfMonth } = this.props;

    return <Header key="header-date" daysOfMonth={daysOfMonth} />;
  }

  renderEvents() {
    const { filteredEventTypes } = this.state;

    return filteredEventTypes.map(this.renderEventCalendarRow);
  }

  renderNoData() {
    return (
      <div className="ecos-timesheet__white-block">
        <div className="ecos-timesheet__no-data">{CommonLabels.NO_DATA_BY_FILTERS}</div>
      </div>
    );
  }

  renderEventCalendarRow = (eventItem, userName) => {
    return (
      <CalendarRow key={`calendar-row-${eventItem.name}`}>
        {this.props.daysOfMonth.map(day => {
          const { updatingHours } = this.props;
          const keyHour = CommonTimesheetService.getKeyHours({ number: day.number, eventType: eventItem.name, userName });
          const eventDay = (eventItem.days || []).find(dayItem => dayItem.number === day.number) || {};
          const count = +(eventDay.hours || 0);

          return (
            <CalendarCell
              key={`calendar-cell-${day.number}-${count}`}
              className={classNames({
                'ecos-timesheet__table-calendar-cell_not-available': !get(eventItem, 'hours.editable', false)
              })}
            >
              <Hour
                color={eventItem.color}
                count={count}
                settings={eventItem.hours}
                halfHour={eventItem.name === ServerEventTypes.DAYTIME_WORK}
                onChange={value => this.handleChangeEventHours(eventItem.name, day.number, value, userName)}
                onReset={value => this.handleResetEventHours(eventItem.name, day.number, value, userName)}
                updatingInfo={get(updatingHours, keyHour, null)}
              />
            </CalendarCell>
          );
        })}
      </CalendarRow>
    );
  };

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

  renderLock() {
    const { isAvailable, lockedMessage } = this.props;

    if (isAvailable) {
      return null;
    }

    return (
      <div className="ecos-timesheet__table-lock">
        <div id="timesheet-locked-tooltip">
          <Icon className="icon-custom-lock ecos-timesheet__table-lock-icon" />
          <span>{t(CommonLabels.EDITING_IS_BLOCKED)}</span>
        </div>

        {lockedMessage && (
          <Tooltip innerClassName="ecos-timesheet__table-lock-tooltip" target="timesheet-locked-tooltip" content={lockedMessage} />
        )}
      </div>
    );
  }

  render() {
    const leftId = uniqueId('tableLeftColumn_');
    const rightId = uniqueId('tableRightColumn_');
    const { filteredEventTypes } = this.state;

    return (
      <>
        <div className="ecos-timesheet__table">
          <div className="ecos-timesheet__table-left-column" id={leftId}>
            {this.renderFilter()}
            {this.renderEventTypes()}
            <ResizeBoxes className="ecos-timesheet__resizer" leftId={leftId} rightId={rightId} />
          </div>
          <div className="ecos-timesheet__table-right-column" ref={this._calendarWrapper} id={rightId}>
            {this.renderCalendar()}
          </div>
          {this.renderLock()}
        </div>
        {isEmpty(filteredEventTypes) && this.renderNoData()}
      </>
    );
  }
}

export default BaseTimesheet;
