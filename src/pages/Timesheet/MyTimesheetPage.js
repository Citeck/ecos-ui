import React from 'react';
import get from 'lodash/get';
import values from 'lodash/values';
import { connect } from 'react-redux';

import { t } from '../../helpers/util';
import { CommonLabels, MyTimesheetLabels, ServerStatusKeys } from '../../helpers/timesheet/constants';
import { getNewDateByDayNumber } from '../../helpers/timesheet/util';
import {
  getMyTimesheetByParams,
  initMyTimesheetStart,
  modifyEventDayHours,
  modifyStatus,
  setPopupMessage
} from '../../actions/timesheet/mine';
import MyTimesheetService from '../../services/timesheet/mine';

import { Loader } from '../../components/common';
import { Switch } from '../../components/common/form';
import { TunableDialog } from '../../components/common/dialogs';
import Timesheet, { BlockStatus, DateSlider, Tabs } from '../../components/Timesheet';
import BaseTimesheetPage from './BaseTimesheetPage';

const mapStateToProps = state => ({
  isLoading: get(state, ['timesheetMine', 'isLoading'], false),
  isLoadingStatus: get(state, ['timesheetMine', 'isLoadingStatus'], false),
  status: get(state, ['timesheetMine', 'status'], false),
  mergedEvents: get(state, ['timesheetMine', 'mergedEvents'], false),
  popupMsg: get(state, ['timesheetMine', 'popupMsg'], '')
});

const mapDispatchToProps = dispatch => ({
  initMyTimesheetStart: payload => dispatch(initMyTimesheetStart(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  getMyTimesheetByParams: payload => dispatch(getMyTimesheetByParams(payload)),
  modifyEventDayHours: payload => dispatch(modifyEventDayHours(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload))
});

class MyTimesheetPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    this.state.statusTabs = null;

    this.state.delegatedTo = '';
    this.state.delegationRejected = true;
  }

  componentDidMount() {
    this.props.initMyTimesheetStart();
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

  handleChangeCurrentDate = currentDate => {
    super.handleChangeCurrentDate(currentDate);
    this.props.getMyTimesheetByParams && this.props.getMyTimesheetByParams({ currentDate });
  };

  handleChangeStatus = () => {
    const { status } = this.props;
    const { currentDate } = this.state;
    const outcome = MyTimesheetService.getMyStatusOutcomeByCurrent(status.key);

    this.props.modifyStatus && this.props.modifyStatus({ outcome, status, currentDate });
  };

  handleToggleDelegated = isDelegated => {
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
  };

  handleClickDelegationRejectedConfirm = () => {
    this.setState({
      delegatedTo: '',
      delegationRejected: false,
      isDelegated: false
    });
  };

  handleChangeEventDayHours = data => {
    const { type: eventType, number, value } = data;
    const date = getNewDateByDayNumber(this.state.currentDate, number);

    this.props.modifyEventDayHours && this.props.modifyEventDayHours({ value, date, eventType });
  };

  renderTimesheet = () => {
    const { daysOfMonth, isDelegated } = this.state;
    const { status, mergedEvents } = this.props;

    return (
      <Timesheet
        eventTypes={mergedEvents}
        daysOfMonth={daysOfMonth}
        isAvailable={status.key !== ServerStatusKeys.MANAGER_APPROVAL && !isDelegated}
        lockedMessage={this.lockDescription}
        onChangeHours={this.handleChangeEventDayHours}
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
          <Switch checked={isDelegated} className="ecos-timesheet__delegation-switch-checkbox" onToggle={this.handleToggleDelegated} />

          <span className="ecos-timesheet__delegation-switch-label">
            {t(description)}{' '}
            {delegatedTo && (
              <span className="ecos-timesheet__delegation-switch-label ecos-timesheet__delegation-switch-label_link">{delegatedTo}</span>
            )}
          </span>

          {delegationRejected && (
            <div
              className="ecos-timesheet__delegation-btn ecos-timesheet__delegation-btn-ok"
              onClick={this.handleClickDelegationRejectedConfirm}
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
    const { isLoading, isLoadingStatus, status, popupMsg } = this.props;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(CommonLabels.TIMESHEET_TITLE)}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab} />
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
            <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
          </div>

          <BlockStatus
            currentStatus={status.key}
            onChangeStatus={this.handleChangeStatus}
            noActionBtn={!status.taskId || !values(ServerStatusKeys).includes(status.key)}
            isLoading={isLoadingStatus}
          />
        </div>
        <div className="ecos-timesheet__main-content">
          {isLoading && <Loader className="ecos-timesheet__loader" height={100} width={100} blur />}
          {this.renderTimesheet()}
        </div>
        <TunableDialog isOpen={!!popupMsg} content={popupMsg} onClose={this.handleClosePopup} title={t(CommonLabels.NOTICE)} />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyTimesheetPage);
