import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { deepClone, t } from '../../helpers/util';
import { CommonLabels, DelegateTimesheetLabels } from '../../helpers/timesheet/dictionary';
import { ServerStatusKeys, ServerStatusOutcomeKeys, StatusActionFilters, TimesheetTypes } from '../../constants/timesheet';
import { BaseConfigGroupButtons } from '../../helpers/timesheet/util';
import CommonTimesheetService from '../../services/timesheet/common';
import DelegatedTimesheetService from '../../services/timesheet/delegated';
import {
  getDelegatedTimesheetByParams,
  modifyEventDayHours,
  modifyStatus,
  resetDelegatedTimesheet,
  resetEventDayHours,
  setPopupMessage
} from '../../actions/timesheet/delegated';

import { Loader } from '../../components/common';
import { Btn } from '../../components/common/btns';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';
import BaseTimesheetPage from './BaseTimesheetPage';

const initAction = StatusActionFilters.FILL;
const initStatus = ServerStatusKeys.CORRECTION;

class DelegatedTimesheetsPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    const actions = DelegatedTimesheetService.getDelegatedActions();

    this.state.statusTabs = CommonTimesheetService.getStatusFilters(TimesheetTypes.DELEGATED, initAction);
    this.state.currentStatus = initStatus;
    this.state.actionDelegatedTabs = actions.map(item => ({ ...item, isActive: initAction === item.action }));
    this.state.delegatedTo = '';
    this.state.delegationRejected = true;
  }

  componentDidMount() {
    this.getData();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    super.componentWillReceiveProps(nextProps, nextContext);

    const { actionCounts } = this.props;

    if (JSON.stringify(actionCounts) !== JSON.stringify(nextProps.actionCounts)) {
      const actionDelegatedTabs = this.state.actionDelegatedTabs.map(item => ({
        ...item,
        badge: nextProps.actionCounts[item.action] || 0
      }));

      const sheetTabs = this.state.sheetTabs.map(item => ({
        ...item,
        badge: item.key === TimesheetTypes.DELEGATED ? nextProps.actionCounts.all || 0 : null
      }));

      this.setState({ actionDelegatedTabs, sheetTabs });
    }
  }

  componentWillUnmount() {
    this.props.resetDelegatedTimesheet();
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
          onClick: data => this.handleOpenCommentModal({ ...data, outcome: ServerStatusOutcomeKeys.TASK_DONE })
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
              onClick: data => this.handleOpenCommentModal({ ...data, outcome: ServerStatusOutcomeKeys.SEND_BACK })
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

    this.setState({ actionDelegatedTabs, statusTabs }, this.getData);
  }

  handleClickOffDelegation = data => {
    console.log('handleClickOffDelegation', data);
  };

  handleChangeStatus = (data, outcome) => {
    const { taskId, userName, comment = '' } = data;

    this.props.modifyStatus && this.props.modifyStatus({ outcome, taskId, userName, comment });
  };

  renderTimesheet = () => {
    const { daysOfMonth, isDelegated } = this.state;
    const { mergedList, isLoading, updatingHours } = this.props;
    const activeStatus = this.selectedStatus;

    const filteredList = mergedList.filter(item => {
      if (Array.isArray(activeStatus.key)) {
        return activeStatus.key.includes(item.status);
      }

      return item.status === activeStatus.key;
    });

    if (filteredList.length > 0) {
      return (
        <Timesheet
          groupBy={'user'}
          configGroupBtns={this.configGroupBtns}
          eventTypes={filteredList}
          daysOfMonth={daysOfMonth}
          isAvailable={!isDelegated}
          lockedMessage={this.lockDescription}
          onChangeHours={this.handleChangeEventDayHours.bind(this)}
          onResetHours={this.handleResetEventDayHours.bind(this)}
          updatingHours={updatingHours}
        />
      );
    }

    return isLoading ? null : this.renderNoData();
  };

  render() {
    const { sheetTabs, currentDate, statusTabs, actionDelegatedTabs, currentTimesheetData } = this.state;
    const { isLoading } = this.props;
    const { outcome } = currentTimesheetData || {};

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
        <div className="ecos-timesheet__main-content">
          {isLoading && <Loader className="ecos-timesheet__loader" height={100} width={100} blur />}
          {this.renderTimesheet()}
        </div>
        {this.renderPopupMessage()}
        {this.renderCommentModal(outcome === ServerStatusOutcomeKeys.SEND_BACK)}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  mergedList: get(state, 'timesheetDelegated.mergedList', []),
  actionCounts: get(state, 'timesheetDelegated.actionCounts', []),
  updatingHours: get(state, 'timesheetDelegated.updatingHours', {}),
  isLoading: get(state, 'timesheetDelegated.isLoading', false),
  popupMsg: get(state, 'timesheetDelegated.popupMsg', '')
});

const mapDispatchToProps = dispatch => ({
  getDelegatedTimesheetByParams: payload => dispatch(getDelegatedTimesheetByParams(payload)),
  resetDelegatedTimesheet: payload => dispatch(resetDelegatedTimesheet(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  modifyEventDayHours: payload => dispatch(modifyEventDayHours(payload)),
  resetEventDayHours: payload => dispatch(resetEventDayHours(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DelegatedTimesheetsPage);
