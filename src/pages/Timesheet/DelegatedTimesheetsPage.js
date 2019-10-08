import React from 'react';

import { deepClone, t } from '../../helpers/util';
import {
  CommonLabels,
  DelegateTimesheetLabels,
  StatusActions,
  StatusesServerKeys,
  TimesheetTypes
} from '../../helpers/timesheet/constants';
import { getDaysOfMonth, isOnlyContent } from '../../helpers/timesheet/util';
import CommonTimesheetService from '../../services/timesheet/common';

import { DateSlider, Tabs } from '../../components/Timesheet';
import Timesheet from '../../components/Timesheet/Timesheet';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { Btn } from '../../components/common/btns';

import { TimesheetApi } from '../../api/timesheet/timesheet';

import './style.scss';

const timesheetApi = new TimesheetApi();

class DelegatedTimesheetsPage extends React.Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    this.cacheDays = new Map();

    this.state = {
      subordinatesEvents: timesheetApi.getEvents(),
      sheetTabs: timesheetApi.getSheetTabs(this.isOnlyContent, location),
      statusTabs: CommonTimesheetService.getStatusFilters(TimesheetTypes.DELEGATED, StatusActions.FILL),
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
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date()),
      currentStatus: StatusesServerKeys.CORRECTION,
      isDelegated: false,
      delegatedTo: '',
      delegationRejected: true,
      actionDelegatedTabs: timesheetApi.getDelegatedActions()
    };
  }

  get isOnlyContent() {
    return isOnlyContent(this.props);
  }

  get selectedAction() {
    const { actionDelegatedTabs } = this.state;

    return (actionDelegatedTabs.find(item => item.isActive) || {}).action;
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

  handleChangeActionTab = tabIndex => {
    const actionDelegatedTabs = deepClone(this.state.actionDelegatedTabs);
    let selectedAction = '';

    actionDelegatedTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;

      if (tab.isActive) {
        selectedAction = tab.action;
      }
    });

    const statusTabs = CommonTimesheetService.getStatusFilters(TimesheetTypes.DELEGATED, selectedAction);

    this.setState({ actionDelegatedTabs, statusTabs });
  };

  handleChangeStatusTab = tabIndex => {
    const statusTabs = deepClone(this.state.statusTabs);

    statusTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ statusTabs });
  };

  renderActionTimesheet = () => {
    const { subordinatesEvents, daysOfMonth, isDelegated } = this.state;

    switch (this.selectedAction) {
      case StatusActions.FILL:
        return (
          <Timesheet
            groupBy={'user'}
            selectedAction={StatusActions.FILL}
            eventTypes={subordinatesEvents}
            daysOfMonth={daysOfMonth}
            isAvailable={!isDelegated}
            onChange={this.handleChangeTimesheet}
            lockedMessage={this.lockDescription}
          />
        );
      case StatusActions.APPROVE:
        return (
          <Timesheet
            groupBy={'user'}
            selectedAction={StatusActions.APPROVE}
            eventTypes={subordinatesEvents}
            daysOfMonth={daysOfMonth}
            isAvailable={!isDelegated}
            onChange={this.handleChangeTimesheet}
            lockedMessage={this.lockDescription}
          />
        );
      default:
        return null;
    }
  };

  render() {
    const { sheetTabs, currentDate, statusTabs, actionDelegatedTabs } = this.state;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(CommonLabels.TIMESHEET_TITLE)}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab} />
            </div>
          </div>

          {this.selectedAction === StatusActions.APPROVE && (
            <div className="ecos-timesheet__column ecos-timesheet__delegation">
              <div className="ecos-timesheet__delegation-title">
                {t(CommonLabels.HEADLINE_DELEGATION)}
                <Btn className="ecos-timesheet__delegation-btn-set ecos-btn_grey7 ecos-btn_narrow">
                  {t(DelegateTimesheetLabels.DELEGATION_BTN_SET)}
                </Btn>
              </div>

              <div className="ecos-timesheet__delegation-label">{DelegateTimesheetLabels.DELEGATION_DESCRIPTION_1}</div>
            </div>
          )}
        </div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__header-box">
            <div className="ecos-timesheet__white-block">
              <Tabs tabs={actionDelegatedTabs} isSmall onClick={this.handleChangeActionTab} />
            </div>
            <div className="ecos-timesheet__date-settings">
              <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
            </div>
          </div>

          <div className="ecos-timesheet__white-block">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab} />
          </div>
        </div>
        {this.renderActionTimesheet()}
      </div>
    );
  }
}

export default DelegatedTimesheetsPage;
