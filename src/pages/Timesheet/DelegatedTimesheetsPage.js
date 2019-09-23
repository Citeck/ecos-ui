import React from 'react';
import get from 'lodash/get';
import { pagesWithOnlyContent } from '../../constants';
import { Statuses } from '../../helpers/timesheet/constants';
import { TimesheetApi } from '../../api/timesheet';

import './style.scss';

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
    const url = get(this.props, ['history', 'location', 'pathname'], '/');

    return pagesWithOnlyContent.includes(url);
  }

  render() {
    const {} = this.state;

    return <React.Fragment>Hi</React.Fragment>;
  }
}

export default DelegatedTimesheetsPage;
