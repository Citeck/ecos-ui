import React, { Component } from 'react';
import 'moment-business-days';

import Timesheet, { BlockStatus, DateSlider, Tabs } from '../../components/Timesheet';
import { Switch } from '../../components/common/form/Checkbox';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { deepClone, t } from '../../helpers/util';
import { Labels, Statuses } from '../../helpers/timesheet/constants';
import { getDaysOfMonth, isOnlyContent } from '../../helpers/timesheet/util';
import { TimesheetApi } from '../../api/timesheet';

import './style.scss';

const timesheetApi = new TimesheetApi();

class MyTimesheetPage extends Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    const eventTypes = timesheetApi.getEventTypes();

    this.cacheDays = new Map();
    this.state = {
      eventTypes,
      subordinatesEvents: timesheetApi.getSubordinatesEvents(),
      sheetTabs: timesheetApi.getSheetTabs(this.isOnlyContent, location),
      dateTabs: [
        {
          name: 'Месяц',
          isActive: true,
          isAvailable: true
        },
        {
          name: 'Год',
          isActive: false,
          isAvailable: false
        }
      ],
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date()),
      currentStatus: Statuses.NEED_IMPROVED,
      isDelegated: false,
      delegatedTo: 'Петренко Сергей Васильевич',
      delegationRejected: true
    };
  }

  get isOnlyContent() {
    return isOnlyContent(this.props);
  }

  getDaysOfMonth = currentDate => {
    //   if (this.cacheDays.has(currentDate)) {
    //     return this.cacheDays.get(currentDate);
    //   }
    const days = getDaysOfMonth(currentDate);
    //   this.cacheDays.set(currentDate, days);
    return days;
  };

  get lockDescription() {
    const { isDelegated, currentStatus } = this.state;

    if (currentStatus === Statuses.WAITING_APPROVAL) {
      return t('Чтобы редактировать табель, нажмите на кнопку "Доработать"');
    }

    if (isDelegated) {
      return t('Чтобы редактировать табель, отключите делегирование на другого сотрудника');
    }

    return '';
  }

  handleChangeActiveSheetTab = tabIndex => {
    const sheetTabs = deepClone(this.state.sheetTabs);

    sheetTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;

      if (tab.isActive) {
        changeUrlLink(tab.link);
      }
    });

    this.setState({ sheetTabs });
  };

  handleChangeActiveDateTab = tabIndex => {
    const dateTabs = deepClone(this.state.dateTabs);

    dateTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ dateTabs });
  };

  handleChangeCurrentDate = currentDate => {
    this.setState({ currentDate, daysOfMonth: this.getDaysOfMonth(currentDate) });
  };

  handleChangeStatus = status => {
    this.setState({ currentStatus: status });
  };

  handleToggleDelegated = isDelegated => {
    this.setState(state => {
      const newState = {
        isDelegated,
        delegatedTo: ''
      };

      if (isDelegated) {
        newState.delegatedTo = 'Петренко Сергей Васильевич';
        newState.delegationRejected = false;
      }

      return newState;
    });
  };

  handleClickDelegationRejectedConfirm = () => {
    this.setState({
      delegatedTo: '',
      delegationRejected: false,
      isDelegated: false
    });
  };

  renderMyTimesheet = () => {
    const { eventTypes, daysOfMonth, currentStatus, isDelegated } = this.state;

    return (
      <Timesheet
        eventTypes={eventTypes}
        daysOfMonth={daysOfMonth}
        isAvailable={currentStatus !== Statuses.WAITING_APPROVAL && !isDelegated}
        lockedMessage={this.lockDescription}
      />
    );
  };

  renderDelegation() {
    const { isDelegated, delegatedTo, delegationRejected } = this.state;
    let description = '';

    if (!isDelegated) {
      description = Labels.DELEGATION_DESCRIPTION_1;
    }

    if (delegationRejected) {
      description = Labels.DELEGATION_DESCRIPTION_3;
    }

    if (delegatedTo) {
      description = `${Labels.DELEGATION_DESCRIPTION_2} - `;
    }

    return (
      <div className="ecos-timesheet__column ecos-timesheet__delegation">
        <div className="ecos-timesheet__delegation-title">{t(Labels.HEADLINE_DELEGATION)}</div>

        <div className="ecos-timesheet__delegation-switch">
          <Switch checked={isDelegated} className="ecos-timesheet__delegation-switch-checkbox" onToggle={this.handleToggleDelegated} />

          <span className="ecos-timesheet__delegation-switch-label">
            {t(description)}{' '}
            {delegatedTo && (
              <span className="ecos-timesheet__delegation-switch-label ecos-timesheet__delegation-switch-label_link">{delegatedTo}</span>
            )}
          </span>

          {delegationRejected && (
            <div
              className="ecos-timesheet__delegation-btn ecos-timesheet__delegation-btn-ok"
              onClick={this.handleClickDelegationRejectedConfirm}
            >
              {t(Labels.DELEGATION_LABEL_REJECT_OK)}
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    const { sheetTabs, currentDate, currentStatus } = this.state;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(Labels.TIMESHEET_TITLE_1)}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab} />
            </div>
          </div>

          {this.renderDelegation()}
        </div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__date-settings">
            {/*<Tabs*/}
            {/*tabs={dateTabs}*/}
            {/*isSmall*/}
            {/*onClick={this.handleChangeActiveDateTab}*/}
            {/*classNameItem="ecos-timesheet__date-settings-tabs-item"*/}
            {/*/>*/}
            <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
          </div>

          <BlockStatus currentStatus={currentStatus} onChangeStatus={this.handleChangeStatus} />
        </div>

        {this.renderMyTimesheet()}
      </div>
    );
  }
}

export default MyTimesheetPage;
