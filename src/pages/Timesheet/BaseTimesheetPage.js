import React from 'react';
import debounce from 'lodash/debounce';
import { getDaysOfMonth } from '../../helpers/timesheet/util';
import CommonTimesheetService from '../../services/timesheet/common';
import { TimesheetTypes } from '../../helpers/timesheet/constants';

class BaseTimesheetPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
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

  componentWillReceiveProps(nextProps, nextContext) {
    const { popupMsg } = nextProps;
    const { turnOnTimerPopup } = this.state;

    if (!!popupMsg && !turnOnTimerPopup) {
      this.setState({ turnOnTimerPopup: true });
      debounce(() => {
        this.handleClosePopup();
        this.setState({ turnOnTimerPopup: false });
      }, 10000)();
    }
  }

  getDaysOfMonth = currentDate => {
    return getDaysOfMonth(currentDate);
  };

  handleClosePopup = () => {
    this.props.setPopupMessage && this.props.setPopupMessage('');
  };

  render() {
    return null;
  }
}

export default BaseTimesheetPage;
