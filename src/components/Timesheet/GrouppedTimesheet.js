import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import uniqueId from 'lodash/uniqueId';

import { deepClone, t } from '../../helpers/util';
import {
  CommonLabels,
  StatusActions,
  StatusesServerKeys,
  StatusesServerOutcomeKeys,
  TimesheetTypes
} from '../../helpers/timesheet/constants';

import { Icon, ResizeBoxes } from '../common';
import { Input } from '../common/form';
import { Btn, IcoBtn } from '../common/btns';
import { SortableContainer, SortableElement, SortableHandle } from '../Drag-n-Drop';
import { CalendarCell, CalendarRow, Collapse, Header } from './Calendar';
import Hour from './Hour';
import BaseTimesheet from './BaseTimesheet';
import Tabs from './Tabs';
import Tooltip from './Tooltip';

import './style.scss';

const FILTER_BY = {
  PEOPLE: 'user',
  COMPANY: 'organization',
  EVENT: 'event'
};

class GrouppedTimesheet extends BaseTimesheet {
  static propTypes = {
    eventTypes: PropTypes.array,
    daysOfMonth: PropTypes.array,
    groupBy: PropTypes.string,
    selectedAction: PropTypes.string,
    selectedStatus: PropTypes.string,
    onChange: PropTypes.func,
    typeSheet: PropTypes.string
  };

  static defaultProps = {
    eventTypes: [],
    daysOfMonth: [],
    groupBy: '',
    selectedAction: '',
    selectedStatus: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      typeFilter: '',
      filteredEventTypes: deepClone(props.eventTypes),
      groupsStatuses: this.initGroupsStatuses(props) || {},
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
      draggableNode: null
    };

    console.warn(this.initGroupsStatuses(props) || {});
  }

  componentWillReceiveProps(nextProps, nextContext) {
    if (JSON.stringify(nextProps.eventTypes) !== JSON.stringify(this.state.filteredEventTypes)) {
      console.warn(this.initGroupsStatuses(nextProps) || {});
      this.setState({
        filteredEventTypes: deepClone(nextProps.eventTypes),
        groupsStatuses: this.initGroupsStatuses(nextProps)
      });
    }
  }

  initGroupsStatuses(props) {
    return props.eventTypes
      .map(item => item[props.groupBy])
      .reduce(
        (result, key, index) => ({
          ...result,
          [key]: !index
        }),
        {}
      );
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

  handleToggleGroupCollapse = event => {
    const key = event.target.dataset.key;

    event.stopPropagation();

    this.setState(state => {
      const { groupsStatuses } = state;

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

  handleChangeStatus = (position, outcome) => {
    const data = this.state.filteredEventTypes[position];
    data.outcome = outcome;

    this.props.onChangeStatus && this.props.onChangeStatus(data);
  };

  handleClickOffDelegation = position => {
    console.log('handleClickOffDelegation');
  };

  filterTypes(typeFilter = '') {
    let filteredEventTypes = deepClone(this.props.eventTypes);

    if (typeFilter) {
      filteredEventTypes = this.getFiltered(filteredEventTypes, typeFilter);
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
            placeholder={t(CommonLabels.FIND_EMPLOYEE_TIP)}
            value={typeFilter}
            onChange={this.handleFilterTypes}
          />
          {typeFilter && <Icon className="icon-close ecos-timesheet__table-search-input-clear" onClick={this.handleClearFilterTypes} />}
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
        <div className="ecos-timesheet__table-events">{group.map((item, index) => this.renderEventType(item, index, key))}</div>
      </SortableContainer>
    );
  }

  renderGroupedEvents() {
    const { filteredEventTypes } = this.state;
    const { selectedAction, selectedStatus, typeSheet } = this.props;

    const renderGroupBtn = index => {
      const btnRevision = (
        <IcoBtn
          icon="icon-arrow-left"
          className="ecos-btn_grey8 ecos-timesheet__table-group-btn_revision ecos-btn_narrow"
          onClick={() => this.handleChangeStatus(index, StatusesServerOutcomeKeys.SEND_BACK)}
          id={`ecos-timesheet__table-group-btn_revision_${index}-message`}
        >
          {t(CommonLabels.STATUS_BTN_SENT_IMPROVE)}
        </IcoBtn>
      );
      const btnApprove = (
        <IcoBtn
          icon="icon-check"
          className="ecos-btn_grey8 ecos-timesheet__table-group-btn_approve ecos-btn_narrow"
          onClick={() => this.handleChangeStatus(index, StatusesServerOutcomeKeys.APPROVE)}
          id={`ecos-timesheet__table-group-btn_sent-approve_${index}-message`}
        >
          {t(CommonLabels.STATUS_BTN_APPROVE)}
        </IcoBtn>
      );
      const btnSentManagerApprove = (
        <IcoBtn
          icon="icon-arrow"
          className="ecos-btn_grey8 ecos-timesheet__table-group-btn_sent-manager-approve ecos-btn_narrow"
          onClick={() => this.handleChangeStatus(index, StatusesServerOutcomeKeys.APPROVE)}
          id={`ecos-timesheet__table-group-btn_sent-manager-approve_${index}-message`}
        >
          {t(CommonLabels.STATUS_BTN_SEND_MANAGER_APPROVE)}
        </IcoBtn>
      );
      const tooltipRevision = (
        <Tooltip
          target={`ecos-timesheet__table-group-btn_revision_${index}-message`}
          content={t(CommonLabels.STATUS_TIP_SENT_IMPROVE_1)}
          innerClassName="ecos-timesheet__table-group-tooltip"
        />
      );
      const tooltipApprove1 = (
        <Tooltip
          target={`ecos-timesheet__table-group-btn_sent-approve_${index}-message`}
          content={t(CommonLabels.STATUS_TIP_APPROVE_1)}
          innerClassName="ecos-timesheet__table-group-tooltip"
        />
      );
      const tooltipApprove2 = (
        <Tooltip
          target={`ecos-timesheet__table-group-btn_sent-approve_${index}-message`}
          content={t(CommonLabels.STATUS_TIP_APPROVE_2)}
          innerClassName="ecos-timesheet__table-group-tooltip"
        />
      );
      const tooltipSentManagerApprove = (
        <Tooltip
          target={`ecos-timesheet__table-group-btn_sent-manager-approve_${index}-message`}
          content={t(CommonLabels.STATUS_TIP_SEND_MANAGER_APPROVE_1)}
          innerClassName="ecos-timesheet__table-group-tooltip"
        />
      );

      const btnEmpty = <div className="ecos-timesheet__empty-btn ecos-timesheet__empty-btn_narrow" />;

      if (typeSheet === TimesheetTypes.DELEGATED || typeSheet === TimesheetTypes.SUBORDINATES) {
        switch (selectedAction) {
          case StatusActions.APPROVE:
            return (
              <>
                {btnRevision}
                {btnApprove}
              </>
            );
          case StatusActions.FILL:
            return (
              <>
                <Btn
                  className="ecos-btn_grey8 ecos-timesheet__table-group-btn_off-delegation ecos-btn_narrow"
                  onClick={() => this.handleClickOffDelegation(index)}
                >
                  {t(CommonLabels.STATUS_BTN_OFF_DELEGATION)}
                </Btn>
                <Btn
                  className="ecos-btn_grey8  ecos-timesheet__table-group-btn_sent-approve ecos-btn_narrow"
                  onClick={() => this.handleChangeStatus(index)}
                >
                  {t(CommonLabels.STATUS_BTN_SENT_APPROVE)}
                </Btn>
              </>
            );
          default:
            return null;
        }
      } else if (typeSheet === TimesheetTypes.VERIFICATION) {
        switch (selectedStatus) {
          case StatusesServerKeys.NOT_FILLED:
          case StatusesServerKeys.CORRECTION:
            return (
              <>
                {btnApprove}
                {tooltipApprove2}
                {btnSentManagerApprove}
                {tooltipSentManagerApprove}
              </>
            );
          case StatusesServerKeys.MANAGER_APPROVAL:
          case StatusesServerKeys.APPROVED_BY_MANAGER:
            return (
              <>
                {btnRevision}
                {tooltipRevision}
                {btnApprove}
                {selectedStatus === StatusesServerKeys.APPROVED_BY_MANAGER ? tooltipApprove1 : tooltipApprove2}
              </>
            );
          case StatusesServerKeys.APPROVED_BY_HR:
            return (
              <>
                {btnEmpty}
                {btnRevision}
                {tooltipRevision}
              </>
            );
          default:
            return null;
        }
      }
    };

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
            <SortableElement key={`${item.user}`} index={index}>
              <div className="ecos-timesheet__table-group">
                <div className="ecos-timesheet__table-group-header">
                  <div className="ecos-timesheet__table-group-line">
                    <div className="ecos-timesheet__table-group-name">
                      <SortableHandle>
                        <Icon className="icon-drag ecos-timesheet__table-group-header-dnd" />
                      </SortableHandle>

                      <Icon
                        className={classNames('icon-down ecos-timesheet__table-group-collapse', {
                          'ecos-timesheet__table-group-collapse_open': this.getGroupStatus(item.user)
                        })}
                        data-key={item.user}
                        onClick={this.handleToggleGroupCollapse}
                      />

                      <div className="ecos-timesheet__table-group-header-title">{item.user}</div>
                    </div>

                    {/* TODO: использовать проверку на наличие новых комментариев */}

                    <div className="ecos-timesheet__table-group-number">
                      {this.getGroupStatus(item.user) ? (
                        <>
                          <Icon
                            id={`timesheet-group-${index}-history`}
                            className="icon-history ecos-timesheet__table-group-header-history"
                          />
                          <Tooltip
                            target={`timesheet-group-${index}-history`}
                            content={t(CommonLabels.SHOW_EVEN_HISTORY_TIP)}
                            innerClassName="ecos-timesheet__table-group-tooltip"
                          />
                        </>
                      ) : (
                        <>
                          <Icon
                            id={`timesheet-group-${index}-message`}
                            className="icon-notify-dialogue ecos-timesheet__table-group-header-message"
                          />
                          <Tooltip
                            target={`timesheet-group-${index}-message`}
                            content={t(CommonLabels.SHOW_COMMENT_TIP)}
                            innerClassName="ecos-timesheet__table-group-tooltip"
                          />
                        </>
                      )}
                      <div className="ecos-timesheet__table-group-header-badge">{item.timesheetNumber}</div>
                    </div>
                  </div>

                  <div className="ecos-timesheet__table-group-line ecos-timesheet__table-group-line_space-between ">
                    {renderGroupBtn(index)}
                  </div>
                </div>

                <Collapse isOpen={this.getGroupStatus(item.user)} transition="height 250ms linear 0s">
                  {this.renderEventsGroup(item.eventTypes, index)}
                </Collapse>
              </div>
            </SortableElement>
          ))}
        </div>
      </SortableContainer>
    );
  }

  renderEventType = (item, position, groupPosition) => (
    <SortableElement key={item.title} index={position}>
      <div className="ecos-timesheet__table-events-item">
        <SortableHandle>
          <Icon className="icon-drag ecos-timesheet__table-events-item-dnd" />
        </SortableHandle>

        <div className="ecos-timesheet__table-events-item-filter" style={{ backgroundColor: item.color || '#D0D0D0' }} />
        <div className="ecos-timesheet__table-events-item-title">{item.title}</div>
        {/*<Icon className="icon-plus ecos-timesheet__table-events-item-add-btn" id={`event-type-${position}-group-${groupPosition}`} />*/}
        {/*<Tooltip target={`event-type-${position}-group-${groupPosition}`} content={t(CommonLabels.ADD_DAYS)} />*/}
      </div>
    </SortableElement>
  );

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
    const { daysOfMonth, groupBy } = this.props;
    const { filteredEventTypes } = this.state;

    return filteredEventTypes.map(item => (
      <div key={`event-${item.user}`}>
        <CalendarRow>{daysOfMonth.map(this.renderCountByDay)}</CalendarRow>
        <Collapse
          transition="height 250ms linear 0s"
          className="ecos-timesheet__table-group-collapse-wrapper"
          isOpen={this.getGroupStatus(item[groupBy])}
        >
          {item.eventTypes.map(this.renderEventCalendarRow)}
        </Collapse>
      </div>
    ));
  }

  renderEventCalendarRow = eventItem => (
    <CalendarRow key={`calendar-row-${eventItem.name}`}>
      {this.props.daysOfMonth.map(day => {
        const eventDay = (eventItem.days || []).find(dayItem => dayItem.number === day.number) || {};
        const count = +(eventDay.hours || 0);

        return (
          <CalendarCell key={`calendar-cell-${day.number}`}>
            <Hour
              color={eventItem.color}
              count={count}
              canEdit={eventItem.canEdit}
              onChange={value => this.handleChangeEventHours(eventDay, value)}
            />
          </CalendarCell>
        );
      })}
    </CalendarRow>
  );

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

  render() {
    const leftId = uniqueId('tableLeftColumn_');
    const rightId = uniqueId('tableRightColumn_');

    return (
      <div className="ecos-timesheet__table">
        <div className="ecos-timesheet__table-left-column" id={leftId}>
          {this.renderFilter()}
          {this.renderGroupedEvents()}
          <ResizeBoxes className="ecos-timesheet__resizer" leftId={leftId} rightId={rightId} />
        </div>
        <div className="ecos-timesheet__table-right-column" ref={this._calendarWrapper} id={rightId}>
          {this.renderCalendar()}
        </div>

        {this.renderLock()}
      </div>
    );
  }
}

export default GrouppedTimesheet;
