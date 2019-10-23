import React from 'react';
import get from 'lodash/get';
import values from 'lodash/values';
import { connect } from 'react-redux';

import { t } from '../../helpers/util';
import { CommonLabels, MyTimesheetLabels, ServerStatusKeys } from '../../helpers/timesheet/constants';
import {
  getMyTimesheetByParams,
  getStatus,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  resetMyTimesheet,
  setPopupMessage,
  setUpdatingStatus
} from '../../actions/timesheet/mine';
import MyTimesheetService from '../../services/timesheet/mine';

import { Loader } from '../../components/common';
import { Switch } from '../../components/common/form';
import Timesheet, { BlockStatus, DateSlider, Tabs } from '../../components/Timesheet';
import BaseTimesheetPage from './BaseTimesheetPage';
import { debounce } from 'lodash';

class MyTimesheetPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    this.state.statusTabs = null;

    this.state.delegatedTo = '';
    this.state.delegationRejected = true;
  }

  statusPing = debounce(() => {
    const { currentDate } = this.state;

    this.props.getStatus && this.props.getStatus({ currentDate });
  }, 3000);

  componentDidMount() {
    this.getData();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    super.componentWillReceiveProps(nextProps, nextContext);

    const { countAttemptGetStatus, status } = this.props;

    if (nextProps.isUpdatingStatus && nextProps.countAttemptGetStatus !== countAttemptGetStatus) {
      this.statusPing();
    } else if (nextProps.isUpdatingStatus && (nextProps.countAttemptGetStatus === 0 || status.key !== nextProps.status.key)) {
      this.statusPing.cancel();
      this.props.setUpdatingStatus && this.props.setUpdatingStatus(false);
    }
  }

  componentWillUnmount() {
    this.props.resetMyTimesheet();
  }

  get lockDescription() {
    const { isDelegated } = this.state;
    const { status } = this.props;

    if (status.key === ServerStatusKeys.MANAGER_APPROVAL) {
      return t(MyTimesheetLabels.LOCK_DESCRIPTION_1);
    }

    if (isDelegated) {
      return t(MyTimesheetLabels.LOCK_DESCRIPTION_2);
    }

    return '';
  }

  getData = () => {
    const { currentDate } = this.state;

    this.props.getMyTimesheetByParams && this.props.getMyTimesheetByParams({ currentDate });
  };

  handleChangeCurrentDate(currentDate) {
    super.handleChangeCurrentDate(currentDate, this.getData);
  }

  handleChangeStatus() {
    const { status } = this.props;
    const outcome = MyTimesheetService.getMyStatusOutcomeByCurrent(status.key);

    if (status.key === ServerStatusKeys.CORRECTION) {
      this.handleSentImprove({ outcome, status });

      return;
    }

    this.props.modifyStatus && this.props.modifyStatus({ outcome, status });
  }

  handleSendComment = comment => {
    this.props.modifyStatus && this.props.modifyStatus({ ...this.state.currenTimesheetData, comment });

    this.clearCommentModalData();
  };

  handleToggleDelegated(isDelegated) {
    this.setState(state => {
      const newState = {
        isDelegated,
        delegatedTo: ''
      };

      if (isDelegated) {
        newState.delegatedTo = 'Петренко Сергей Васильевич';
        newState.delegationRejected = false;
      }

      return newState;
    });
  }

  handleClickDelegationRejectedConfirm() {
    this.setState({
      delegatedTo: '',
      delegationRejected: false,
      isDelegated: false
    });
  }

  renderTimesheet = () => {
    const { daysOfMonth, isDelegated } = this.state;
    const { status, mergedEvents, updatingHours } = this.props;

    return (
      <Timesheet
        eventTypes={mergedEvents}
        daysOfMonth={daysOfMonth}
        isAvailable={status.key !== ServerStatusKeys.MANAGER_APPROVAL && !isDelegated}
        lockedMessage={this.lockDescription}
        onChangeHours={this.handleChangeEventDayHours.bind(this)}
        onResetHours={this.handleResetEventDayHours.bind(this)}
        updatingHours={updatingHours}
      />
    );
  };

  renderDelegation() {
    const { isDelegated, delegatedTo, delegationRejected } = this.state;
    let description = '';

    if (!isDelegated) {
      description = MyTimesheetLabels.DELEGATION_DESCRIPTION_1;
    }

    if (delegationRejected) {
      description = MyTimesheetLabels.DELEGATION_DESCRIPTION_3;
    }

    if (delegatedTo) {
      description = MyTimesheetLabels.DELEGATION_DESCRIPTION_2;
    }

    return (
      <div className="ecos-timesheet__column ecos-timesheet__delegation">
        <div className="ecos-timesheet__delegation-title">{t(CommonLabels.HEADLINE_DELEGATION)}</div>

        <div className="ecos-timesheet__delegation-switch">
          <Switch
            checked={isDelegated}
            className="ecos-timesheet__delegation-switch-checkbox"
            onToggle={this.handleToggleDelegated.bind(this)}
          />

          <span className="ecos-timesheet__delegation-switch-label">
            {t(description)}{' '}
            {delegatedTo && (
              <span className="ecos-timesheet__delegation-switch-label ecos-timesheet__delegation-switch-label_link">{delegatedTo}</span>
            )}
          </span>

          {delegationRejected && (
            <div
              className="ecos-timesheet__delegation-btn ecos-timesheet__delegation-btn-ok"
              onClick={this.handleClickDelegationRejectedConfirm.bind(this)}
            >
              {t(MyTimesheetLabels.DELEGATION_LABEL_REJECT_OK)}
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    const { sheetTabs, currentDate } = this.state;
    const { isLoading, isLoadingStatus, isUpdatingStatus, status } = this.props;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(CommonLabels.TIMESHEET_TITLE)}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab.bind(this)} />
            </div>
          </div>

          {this.renderDelegation()}
        </div>

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

          <BlockStatus
            currentStatus={status.key}
            onChangeStatus={this.handleChangeStatus.bind(this)}
            noActionBtn={!status.taskId || !values(ServerStatusKeys).includes(status.key)}
            isLoading={isLoadingStatus || isUpdatingStatus}
            record={status.recordRef}
            comment={status.comment}
          />
        </div>
        <div className="ecos-timesheet__main-content">
          {isLoading && <Loader className="ecos-timesheet__loader" height={100} width={100} blur />}
          {this.renderTimesheet()}
        </div>
        {this.renderPopupMessage()}
        {this.renderCommentModal()}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isLoading: get(state, 'timesheetMine.isLoading', false),
  isLoadingStatus: get(state, 'timesheetMine.isLoadingStatus', false),
  isUpdatingStatus: get(state, 'timesheetMine.isUpdatingStatus', false),
  status: get(state, 'timesheetMine.status', {}),
  countAttemptGetStatus: get(state, 'timesheetMine.countAttemptGetStatus', 0),
  mergedEvents: get(state, 'timesheetMine.mergedEvents', []),
  updatingHours: get(state, 'timesheetMine.updatingHours', {}),
  popupMsg: get(state, 'timesheetMine.popupMsg', '')
});

const mapDispatchToProps = dispatch => ({
  getMyTimesheetByParams: payload => dispatch(getMyTimesheetByParams(payload)),
  resetMyTimesheet: payload => dispatch(resetMyTimesheet(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  setUpdatingStatus: payload => dispatch(setUpdatingStatus(payload)),
  modifyEventDayHours: payload => dispatch(modifyEventDayHours(payload)),
  resetEventDayHours: payload => dispatch(resetEventDayHours(payload)),
  getStatus: payload => dispatch(getStatus(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyTimesheetPage);
