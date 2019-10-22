import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { deepClone, t } from '../../helpers/util';
import {
  CommonLabels,
  DelegateTimesheetLabels,
  ServerStatusKeys,
  ServerStatusOutcomeKeys,
  StatusActionFilters,
  TimesheetTypes
} from '../../helpers/timesheet/constants';
import { BaseConfigGroupButtons } from '../../helpers/timesheet/util';
import CommonTimesheetService from '../../services/timesheet/common';
import { getDelegatedTimesheetByParams, setPopupMessage } from '../../actions/timesheet/delegated';

import { Btn } from '../../components/common/btns';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';
import BaseTimesheetPage from './BaseTimesheetPage';

import { TimesheetApi } from '../../api/timesheet/timesheet';

const timesheetApi = new TimesheetApi();

class DelegatedTimesheetsPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    this.state.statusTabs = CommonTimesheetService.getStatusFilters(TimesheetTypes.DELEGATED, StatusActionFilters.FILL);
    this.state.currentStatus = ServerStatusKeys.CORRECTION;
    this.state.delegatedTo = '';
    this.state.delegationRejected = true;
    this.state.actionDelegatedTabs = timesheetApi.getDelegatedActions();
  }

  componentDidMount() {
    this.getData();
  }

  get selectedAction() {
    const { actionDelegatedTabs } = this.state;

    return (actionDelegatedTabs.find(item => item.isActive) || {}).action;
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
          ...BaseConfigGroupButtons.SENT_APPROVE,
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
              ...BaseConfigGroupButtons.APPROVE,
              onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.TASK_DONE)
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
              onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.APPROVE)
            }
          ];
      }
    }

    return [{}, {}];
  }

  getData = () => {
    const { currentDate } = this.state;
    const action = this.selectedAction;

    this.props.getDelegatedTimesheetByParams && this.props.getDelegatedTimesheetByParams({ currentDate, action });
  };

  handleChangeCurrentDate(currentDate) {
    super.handleChangeCurrentDate(currentDate, this.getData);
  }

  handleChangeActionTab(tabIndex) {
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
  }

  handleClickOffDelegation = data => {
    console.log('handleClickOffDelegation', data);
  };

  handleChangeStatus = (data, outcome) => {
    const { currentDate } = this.state;
    const { taskId, userName } = data;
    console.log('handleChangeStatus', { outcome, taskId, userName, currentDate });
  };

  renderTimesheet() {
    const { daysOfMonth, isDelegated } = this.state;
    const { mergedList } = this.props;

    return (
      <Timesheet
        groupBy={'user'}
        configGroupBtns={this.configGroupBtns}
        eventTypes={mergedList}
        daysOfMonth={daysOfMonth}
        isAvailable={!isDelegated}
        lockedMessage={this.lockDescription}
        handleChangeEventDayHours
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
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab.bind(this)} />
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
              <Tabs tabs={actionDelegatedTabs} isSmall onClick={this.handleChangeActionTab.bind(this)} />
            </div>
            <div className="ecos-timesheet__date-settings">
              <DateSlider onChange={this.handleChangeCurrentDate.bind(this)} date={currentDate} />
            </div>
          </div>

          <div className="ecos-timesheet__white-block">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab.bind(this)} />
          </div>
        </div>
        {this.renderTimesheet()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  mergedList: get(state, 'timesheetSubordinates.mergedList', []),
  isLoading: get(state, 'timesheetSubordinates.isLoading', false),
  popupMsg: get(state, 'timesheetSubordinates.popupMsg', '')
});

const mapDispatchToProps = dispatch => ({
  getDelegatedTimesheetByParams: payload => dispatch(getDelegatedTimesheetByParams(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DelegatedTimesheetsPage);
