import React, { Component } from 'react';
import 'moment-business-days';
import { deepClone, t } from '../../helpers/util';
import { getDaysOfMonth, isOnlyContent } from '../../helpers/timesheet/util';
import { CommonLabels, StatusCategories, SubTimesheetLabels } from '../../helpers/timesheet/constants';
import { Switch } from '../../components/common/form';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { TimesheetApi } from '../../api/timesheet';

import './style.scss';

const timesheetApi = new TimesheetApi();

class SubordinatesTimesheetPage extends Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    const eventTypes = timesheetApi.getEventTypes();

    this.state = {
      eventTypes,
      subordinatesEvents: timesheetApi.getSubordinatesEvents(),
      sheetTabs: timesheetApi.getSheetTabs(this.isOnlyContent, location),
      dateTabs: [
        {
          name: t(CommonLabels.MONTH),
          isActive: true,
          isAvailable: true
        },
        {
          name: t(CommonLabels.YEAR),
          isActive: false,
          isAvailable: false
        }
      ],
      statusTabs: timesheetApi.getStatuses(StatusCategories.APPROVE),
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date()),
      isDelegated: false
    };
  }

  get isOnlyContent() {
    return isOnlyContent(this.props);
  }

  getDaysOfMonth = currentDate => {
    return getDaysOfMonth(currentDate);
  };

  get lockDescription() {
    const { isDelegated } = this.state;

    if (isDelegated) {
      return t(SubTimesheetLabels.LOCK_DESCRIPTION_1);
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

  handleToggleDelegated = isDelegated => {
    this.setState({ isDelegated });
  };

  renderSubordinateTimesheet = () => {
    const { subordinatesEvents, daysOfMonth, isDelegated } = this.state;

    return (
      <Timesheet
        groupBy={'user'}
        eventTypes={subordinatesEvents}
        daysOfMonth={daysOfMonth}
        isAvailable={!isDelegated}
        onChange={this.handleChangeTimesheet}
        lockedMessage={this.lockDescription}
      />
    );
  };

  render() {
    const { sheetTabs, isDelegated, currentDate, statusTabs } = this.state;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(CommonLabels.TIMESHEET_TITLE)}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab} />
            </div>
          </div>

          <div className="ecos-timesheet__column ecos-timesheet__delegation">
            <div className="ecos-timesheet__delegation-title">{t(CommonLabels.HEADLINE_DELEGATION)}</div>

            <div className="ecos-timesheet__delegation-switch">
              <Switch checked={isDelegated} className="ecos-timesheet__delegation-switch-checkbox" onToggle={this.handleToggleDelegated} />

              <span className="ecos-timesheet__delegation-switch-label">{t(SubTimesheetLabels.DELEGATION_DESCRIPTION_1)}</span>
            </div>
          </div>
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

          <div className="ecos-timesheet__white-block">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab} />
          </div>
        </div>

        {this.renderSubordinateTimesheet()}
      </div>
    );
  }
}

export default SubordinatesTimesheetPage;
