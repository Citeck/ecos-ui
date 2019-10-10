import React, { Component } from 'react';
import 'moment-business-days';

import { deepClone, t } from '../../helpers/util';
import {
  CommonLabels,
  ServerStatusKeys,
  ServerStatusOutcomeKeys,
  TimesheetTypes,
  VerifyTimesheetLabels
} from '../../helpers/timesheet/constants';
import { BaseConfigGroupButtons, getDaysOfMonth } from '../../helpers/timesheet/util';
import CommonTimesheetService from '../../services/timesheet/common';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';

import { TimesheetApi } from '../../api/timesheet/timesheet';

import './style.scss';

const timesheetApi = new TimesheetApi();

class VerificationTimesheetPage extends Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    this.state = {
      subordinatesEvents: timesheetApi.getEvents(),
      dateTabs: CommonTimesheetService.getPeriodFiltersTabs(),
      statusTabs: CommonTimesheetService.getStatusFilters(TimesheetTypes.VERIFICATION),
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date())
    };
  }

  get selectedStatus() {
    const { statusTabs } = this.state;

    return statusTabs.find(item => item.isActive) || {};
  }

  get configGroupBtns() {
    const status = this.selectedStatus;

    switch (status.key) {
      case ServerStatusKeys.NOT_FILLED:
      case ServerStatusKeys.CORRECTION:
        return [
          {
            ...BaseConfigGroupButtons.SEND_MANAGER_APPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.TASK_DONE)
          },
          {
            ...BaseConfigGroupButtons.APPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.HR_APPROVE)
          }
        ];
      case ServerStatusKeys.MANAGER_APPROVAL:
        return [
          {
            ...BaseConfigGroupButtons.SENT_IMPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.SEND_BACK)
          },
          {
            ...BaseConfigGroupButtons.APPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.HR_APPROVE),
            tooltip: t(CommonLabels.STATUS_TIP_APPROVE_2)
          }
        ];
      case ServerStatusKeys.APPROVED_BY_MANAGER:
        return [
          {
            ...BaseConfigGroupButtons.SENT_IMPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.SEND_BACK)
          },
          {
            ...BaseConfigGroupButtons.APPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.APPROVE)
          }
        ];
      case ServerStatusKeys.APPROVED_BY_HR:
        return [
          {
            ...BaseConfigGroupButtons.SENT_IMPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.SEND_BACK)
          },
          {}
        ];
      default:
        return [{}, {}];
    }
  }

  getDaysOfMonth = currentDate => {
    return getDaysOfMonth(currentDate);
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

  handleChangeStatusTab = tabIndex => {
    const statusTabs = deepClone(this.state.statusTabs);

    statusTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ statusTabs });
  };

  handleChangeTimesheet = subordinatesEvents => {
    this.setState({ subordinatesEvents });
  };

  renderSubordinateTimesheet = () => {
    const { subordinatesEvents, daysOfMonth, statusTabs } = this.state;
    const selectedStatus = statusTabs.find(status => status.isActive) || {};

    return (
      <Timesheet
        groupBy={'user'}
        eventTypes={subordinatesEvents}
        daysOfMonth={daysOfMonth}
        configGroupBtns={this.configGroupBtns}
        isAvailable
        onChange={this.handleChangeTimesheet}
      />
    );
  };

  render() {
    const { sheetTabs, dateTabs, currentDate, statusTabs } = this.state;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__title">{t(VerifyTimesheetLabels.TIMESHEET_TITLE)}</div>

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

          <div className="ecos-timesheet__status">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab} classNameItem="ecos-timesheet__status-tabs-item" />
          </div>
        </div>

        {this.renderSubordinateTimesheet()}
      </div>
    );
  }
}

export default VerificationTimesheetPage;
