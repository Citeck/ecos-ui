import React from 'react';

import { deepClone, t } from '../../helpers/util';
import {
  CommonLabels,
  DelegateTimesheetLabels,
  ServerStatusKeys,
  ServerStatusOutcomeKeys,
  StatusActionFilters,
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
      sheetTabs: CommonTimesheetService.getSheetTabs(this.isOnlyContent, location),
      statusTabs: CommonTimesheetService.getStatusFilters(TimesheetTypes.DELEGATED, StatusActionFilters.FILL),
      dateTabs: CommonTimesheetService.getPeriodFiltersTabs(),
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date()),
      currentStatus: ServerStatusKeys.CORRECTION,
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

  get selectedStatus() {
    const { statusTabs } = this.state;

    return statusTabs.find(item => item.isActive) || {};
  }

  get configGroupBtns() {
    const status = this.selectedStatus;
    const action = this.selectedAction;
    const key = Array.isArray(status.key) ? status.key[0] : status.key;

    if (action === StatusActionFilters.FILL) {
      return [
        {
          id: 'ecos-timesheet__table-group-btn_off-delegation_id',
          className: 'ecos-timesheet__table-group-btn_off-delegation',
          title: t(CommonLabels.STATUS_BTN_OFF_DELEGATION),
          onClick: data => this.handleClickOffDelegation(data)
        },
        {
          id: 'ecos-timesheet__table-group-btn_sent-approve_id',
          className: 'ecos-timesheet__table-group-btn_sent-approve',
          title: t(CommonLabels.STATUS_BTN_SENT_APPROVE),
          onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.TASK_DONE)
        }
      ];
    }

    if (action === StatusActionFilters.APPROVE) {
      switch (key) {
        case ServerStatusKeys.CORRECTION:
          return [
            {},
            {
              id: 'ecos-timesheet__table-group-btn_sent-approve_id',
              className: 'ecos-timesheet__table-group-btn_approve',
              icon: 'icon-check',
              title: t(CommonLabels.STATUS_BTN_APPROVE),
              onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.TASK_DONE),
              tooltip: t(CommonLabels.STATUS_TIP_APPROVE_1)
            }
          ];
        case ServerStatusKeys.MANAGER_APPROVAL:
          return [
            {
              id: 'ecos-timesheet__table-group-btn_revision_id',
              className: 'ecos-timesheet__table-group-btn_revision',
              icon: 'icon-arrow-left',
              title: t(CommonLabels.STATUS_BTN_SENT_IMPROVE),
              onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.SEND_BACK),
              tooltip: t(CommonLabels.STATUS_TIP_SENT_IMPROVE_1)
            },
            {
              id: 'ecos-timesheet__table-group-btn_approve_id',
              className: 'ecos-timesheet__table-group-btn_approve',
              icon: 'icon-check',
              title: t(CommonLabels.STATUS_BTN_APPROVE),
              onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.APPROVE),
              tooltip: t(CommonLabels.STATUS_TIP_APPROVE_1)
            }
          ];
      }
    }

    return [{}, {}];
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

  handleClickOffDelegation = data => {
    console.log('handleClickOffDelegation', data);
  };

  handleChangeStatus = (data, outcome) => {
    const { currentDate } = this.state;
    const { taskId, userName } = data;
    console.log('handleChangeStatus', { outcome, taskId, userName, currentDate });
    //this.props.modifyStatus && this.props.modifyStatus({ outcome, taskId, userName, currentDate });
  };

  renderActionTimesheet() {
    const { subordinatesEvents, daysOfMonth, isDelegated } = this.state;

    return (
      <Timesheet
        groupBy={'user'}
        configGroupBtns={this.configGroupBtns}
        eventTypes={subordinatesEvents}
        daysOfMonth={daysOfMonth}
        isAvailable={!isDelegated}
        onChange={this.handleChangeTimesheet}
        lockedMessage={this.lockDescription}
      />
    );
  }

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

          {this.selectedAction === StatusActionFilters.APPROVE && (
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
