import React, { Component } from 'react';
import 'moment-business-days';

import { deepClone, t } from '../../helpers/util';
import { StatusActions, TimesheetTypes, VerifyTimesheetLabels } from '../../helpers/timesheet/constants';
import { getDaysOfMonth } from '../../helpers/timesheet/util';
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
        isAvailable
        selectedStatus={selectedStatus.key}
        selectedAction={StatusActions.VERIFY}
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
