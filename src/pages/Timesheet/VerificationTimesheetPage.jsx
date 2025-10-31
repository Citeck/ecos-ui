import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { t } from '../../helpers/util';
import { BaseConfigGroupButtons } from '../../helpers/timesheet/util';
import { CommonLabels, VerifyTimesheetLabels } from '../../helpers/timesheet/dictionary';
import { ServerStatusKeys, ServerStatusOutcomeKeys, TimesheetTypes } from '../../constants/timesheet';
import {
  getCalendarEvents,
  getVerificationTimesheetByParams,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  resetVerificationTimesheet,
  setPopupMessage
} from '../../actions/timesheet/verification';
import CommonTimesheetService from '../../services/timesheet/common';

import { Loader } from '../../components/common';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';
import BaseTimesheetPage from './BaseTimesheetPage';

class VerificationTimesheetPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    this.state.isDelegated = null;

    this.state.statusTabs = CommonTimesheetService.getStatusFilters(TimesheetTypes.VERIFICATION);
  }

  componentDidMount() {
    this.getData();
  }

  componentWillUnmount() {
    this.props.resetVerificationTimesheet();
  }

  get configGroupBtns() {
    const status = this.selectedStatus;

    switch (status.key) {
      case ServerStatusKeys.NOT_FILLED:
      case ServerStatusKeys.CORRECTION:
        return [
          {
            ...BaseConfigGroupButtons.SEND_MANAGER_APPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.TASK_DONE)
          },
          {
            ...BaseConfigGroupButtons.APPROVE,
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.HR_APPROVE)
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
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.HR_APPROVE),
            tooltip: t(CommonLabels.STATUS_TIP_APPROVE_2)
          }
        ];
      case ServerStatusKeys.APPROVED_BY_MANAGER:
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
      case ServerStatusKeys.APPROVED_BY_HR:
        return [
          {
            ...BaseConfigGroupButtons.SENT_IMPROVE,
            onClick: data => this.handleOpenCommentModal({ ...data, outcome: ServerStatusOutcomeKeys.SEND_BACK })
          },
          {}
        ];
      default:
        return [{}, {}];
    }
  }

  getData = () => {
    const { currentDate } = this.state;
    const status = this.selectedStatus.key;

    this.props.getVerificationTimesheetByParams && this.props.getVerificationTimesheetByParams({ currentDate, status });
  };

  handleChangeCurrentDate(currentDate) {
    super.handleChangeCurrentDate(currentDate, this.getData);
  }

  handleChangeStatusTab(tabIndex) {
    super.handleChangeStatusTab(tabIndex, this.getData);
  }

  handleChangeStatus = (data, outcome) => {
    const { taskId, userName, comment = '' } = data;

    this.props.modifyStatus && this.props.modifyStatus({ outcome, taskId, userName, comment });
  };

  renderTimesheet = () => {
    const { daysOfMonth } = this.state;
    const { mergedList, updatingHours, loadingOnTimesheet } = this.props;

    return (
      <Timesheet
        groupBy={'userName'}
        eventTypes={mergedList}
        daysOfMonth={daysOfMonth}
        configGroupBtns={this.configGroupBtns}
        isAvailable
        loadingOnTimesheet={loadingOnTimesheet}
        onChangeHours={this.handleChangeEventDayHours.bind(this)}
        onResetHours={this.handleResetEventDayHours.bind(this)}
        onGetCalendarEvents={this.handleGetCalendarEvents}
        updatingHours={updatingHours}
      />
    );
  };

  render() {
    const { currentDate, statusTabs } = this.state;
    // const { dateTabs } = this.state;
    const { isLoading } = this.props;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__title">{t(VerifyTimesheetLabels.TIMESHEET_TITLE)}</div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__date-settings">
            {/*<Tabs*/}
            {/*tabs={dateTabs}*/}
            {/*isSmall*/}
            {/*onClick={this.handleChangeActiveDateTab}*/}
            {/*classNameItem="ecos-timesheet__date-settings-tabs-item"*/}
            {/*/>*/}
            <DateSlider onChange={this.handleChangeCurrentDate.bind(this)} date={currentDate} />
          </div>

          <div className="ecos-timesheet__status">
            <Tabs
              tabs={statusTabs}
              isSmall
              onClick={this.handleChangeStatusTab.bind(this)}
              classNameItem="ecos-timesheet__status-tabs-item"
            />
          </div>
        </div>
        <div className="ecos-timesheet__main-content">
          {isLoading && <Loader className="ecos-timesheet__loader" height={100} width={100} blur />}
          {this.renderTimesheet()}
        </div>
        {this.renderPopupMessage()}
        {this.renderCommentModal(true)}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  mergedList: get(state, 'timesheetVerification.mergedList', []),
  updatingHours: get(state, 'timesheetVerification.updatingHours', {}),
  isLoading: get(state, 'timesheetVerification.isLoading', false),
  loadingOnTimesheet: get(state, 'timesheetVerification.loadingOnTimesheet', ''),
  popupMsg: get(state, 'timesheetVerification.popupMsg', '')
});

const mapDispatchToProps = dispatch => ({
  getVerificationTimesheetByParams: payload => dispatch(getVerificationTimesheetByParams(payload)),
  resetVerificationTimesheet: payload => dispatch(resetVerificationTimesheet(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  modifyEventDayHours: payload => dispatch(modifyEventDayHours(payload)),
  resetEventDayHours: payload => dispatch(resetEventDayHours(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload)),
  getCalendarEvents: payload => dispatch(getCalendarEvents(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VerificationTimesheetPage);
