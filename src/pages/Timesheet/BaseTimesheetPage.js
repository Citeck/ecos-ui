import React from 'react';
import debounce from 'lodash/debounce';
import { deepClone } from '../../helpers/util';
import { getDaysOfMonth, isOnlyContent } from '../../helpers/timesheet/util';
import { TimesheetTypes } from '../../helpers/timesheet/constants';
import CommonTimesheetService from '../../services/timesheet/common';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';

import './style.scss';

class BaseTimesheetPage extends React.Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    this.cacheDays = new Map();

    this.state = {
      currentDate: new Date(),
      sheetTabs: CommonTimesheetService.getSheetTabs(this.isOnlyContent, location),
      dateTabs: CommonTimesheetService.getPeriodFiltersTabs(),
      statusTabs: CommonTimesheetService.getStatusFilters(TimesheetTypes.VERIFICATION),
      daysOfMonth: this.getDaysOfMonth(new Date()),
      turnOnTimerPopup: false
    };
  }

  get isOnlyContent() {
    return isOnlyContent(this.props);
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
    //   if (this.cacheDays.has(currentDate)) {
    //     return this.cacheDays.get(currentDate);
    //   }
    const days = getDaysOfMonth(currentDate);
    //   this.cacheDays.set(currentDate, days);
    return days;
  };

  handleClosePopup = () => {
    this.props.setPopupMessage && this.props.setPopupMessage('');
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

  render() {
    return null;
  }
}

export default BaseTimesheetPage;
