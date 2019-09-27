import React, { Component } from 'react';
import 'moment-business-days';

import { Labels } from '../../helpers/timesheet/constants';
import { deepClone, t } from '../../helpers/util';
import { getDaysOfMonth } from '../../helpers/timesheet/util';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';
import { TimesheetApi } from '../../api/timesheet';

import './style.scss';

const timesheetApi = new TimesheetApi();

class VerificationTimesheetPage extends Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    const eventTypes = timesheetApi.getEventTypes();

    this.state = {
      eventTypes,
      subordinatesEvents: timesheetApi.getSubordinatesEvents(),
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
      statusTabs: [
        {
          name: 'Не заполнены',
          isActive: true,
          isAvailable: true
        },
        {
          name: 'На согласовании менеджера',
          isActive: false,
          isAvailable: true
        },
        {
          name: 'Согласованы менеджером',
          isActive: false,
          isAvailable: true
        },
        {
          name: 'Отправлены в доработку',
          isActive: false,
          isAvailable: true
        },
        {
          name: 'Согласованные',
          isActive: false,
          isAvailable: true
        }
      ],
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
    const { subordinatesEvents, daysOfMonth } = this.state;

    return (
      <Timesheet
        groupBy={'user'}
        eventTypes={subordinatesEvents}
        daysOfMonth={daysOfMonth}
        isAvailable
        onChange={this.handleChangeTimesheet}
      />
    );
  };

  render() {
    const { sheetTabs, dateTabs, currentDate, statusTabs } = this.state;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__title">{t(Labels.TIMESHEET_TITLE_2)}</div>

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
