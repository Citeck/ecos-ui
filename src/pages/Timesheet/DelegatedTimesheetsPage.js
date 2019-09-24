import React from 'react';
import { Statuses } from '../../helpers/timesheet/constants';
import { getDaysOfMonth, isOnlyContent } from '../../helpers/timesheet/util';
import { TimesheetApi } from '../../api/timesheet';

import './style.scss';
import { deepClone, t } from '../../helpers/util';
import { DateSlider, Tabs } from '../../components/Timesheet';
import Timesheet from '../../components/Timesheet/Timesheet';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';

const timesheetApi = new TimesheetApi();

class DelegatedTimesheetsPage extends React.Component {
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
    return getDaysOfMonth(currentDate);
  };

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

  handleChangeCurrentDate = currentDate => {
    this.setState({ currentDate, daysOfMonth: this.getDaysOfMonth(currentDate) });
  };

  handleChangeStatusTab = status => {
    this.setState({ currentStatus: status });
  };

  renderTimesheetFill = () => {
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
            <div className="ecos-timesheet__title">{t('Табели учёта времени')}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab} />
            </div>
          </div>

          {
            <div className="ecos-timesheet__column ecos-timesheet__delegation">
              <div className="ecos-timesheet__title">{t('Делегирование')}</div>

              <div className="ecos-timesheet__delegation-switch">
                <span className="ecos-timesheet__delegation-switch-label">
                  {t('Табели подчиненных может заполнить другой сотрудник, если включить делегирование.')}
                </span>
              </div>
            </div>
          }
        </div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__date-settings">
            <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
          </div>

          <div className="ecos-timesheet__white-block">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab} />
          </div>
        </div>

        {this.renderTimesheetFill()}
      </div>
    );
  }
}

export default DelegatedTimesheetsPage;
