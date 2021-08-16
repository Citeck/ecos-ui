import React from 'react';
import get from 'lodash/get';
import values from 'lodash/values';
import { connect } from 'react-redux';
import { debounce } from 'lodash';

import { t } from '../../helpers/util';
import { CommonLabels, MyTimesheetLabels } from '../../helpers/timesheet/dictionary';
import { DelegationTypes, ServerStatusKeys } from '../../constants/timesheet';
import {
  delegateTo,
  getMyTimesheetByParams,
  getStatus,
  modifyEventDayHours,
  modifyStatus,
  removeDelegation,
  resetEventDayHours,
  resetMyTimesheet,
  setPopupMessage,
  setUpdatingStatus
} from '../../actions/timesheet/mine';
import MyTimesheetService from '../../services/timesheet/mine';

import { Loader } from '../../components/common';
import { Switch } from '../../components/common/form';
import Timesheet, { BlockStatus, DateSlider, SelectUserModal } from '../../components/Timesheet';
import RouteTypeTabs from '../../components/Timesheet/RouteTypeTabs';
import BaseTimesheetPage from './BaseTimesheetPage';

class MyTimesheetPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    this.state.statusTabs = null;
    this.state.isOpenSelectUserModal = false;
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
    const { status, delegatedToRef } = this.props;

    if (status.key === ServerStatusKeys.MANAGER_APPROVAL) {
      return t(MyTimesheetLabels.LOCK_DESCRIPTION_1);
    }

    if (delegatedToRef) {
      return t(MyTimesheetLabels.LOCK_DESCRIPTION_2);
    }

    return '';
  }

  get isAvailable() {
    const { status, delegatedToRef } = this.props;
    const unavailableStatuses = [
      ServerStatusKeys.MANAGER_APPROVAL,
      ServerStatusKeys.SENT_TO_ACCOUNTING_SYSTEM,
      ServerStatusKeys.APPROVED_BY_HR,
      ServerStatusKeys.APPROVED_BY_MANAGER
    ];

    return !unavailableStatuses.includes(status.key) && !delegatedToRef;
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
      this.handleOpenCommentModal({ outcome, status });

      return;
    }

    this.props.modifyStatus && this.props.modifyStatus({ outcome, status });
  }

  handleSendCommentModal = comment => {
    this.props.modifyStatus && this.props.modifyStatus({ ...this.state.currentTimesheetData, comment });

    this.clearCommentModalData();
  };

  handleToggleDelegated = isDelegated => {
    this.setState(state => {
      const newState = {};

      if (isDelegated) {
        newState.isOpenSelectUserModal = true;
      }

      if (!isDelegated) {
        this.props.removeDelegation();
      }

      return newState;
    });
  };

  handleSelectUser = deputy => {
    const isDelegated = Boolean(deputy);

    if (isDelegated) {
      this.props.delegateTo({ deputy, delegationType: DelegationTypes.FILL });
    }

    this.setState({ isOpenSelectUserModal: false });
  };

  handleCloseSelectUserModal = () => {
    this.setState({ isOpenSelectUserModal: false });
  };

  handleChangeDelegatedToUser = () => {
    this.setState({ isOpenSelectUserModal: true });
  };

  renderTimesheet = () => {
    const { daysOfMonth } = this.state;
    const { mergedEvents, updatingHours } = this.props;

    return (
      <Timesheet
        eventTypes={mergedEvents}
        daysOfMonth={daysOfMonth}
        isAvailable={this.isAvailable}
        lockedMessage={this.lockDescription}
        onChangeHours={this.handleChangeEventDayHours.bind(this)}
        onResetHours={this.handleResetEventDayHours.bind(this)}
        updatingHours={updatingHours}
      />
    );
  };

  renderDelegation() {
    const { delegatedToDisplayName, delegatedToRef } = this.props;
    let description = '';

    if (!delegatedToRef) {
      description = MyTimesheetLabels.DELEGATION_DESCRIPTION_1;
    }

    if (delegatedToDisplayName) {
      description = MyTimesheetLabels.DELEGATION_DESCRIPTION_2;
    }

    return (
      <div className="ecos-timesheet__column ecos-timesheet__delegation">
        <div className="ecos-timesheet__delegation-title">{t(CommonLabels.HEADLINE_DELEGATION)}</div>

        <div className="ecos-timesheet__delegation-switch">
          <Switch
            checked={Boolean(delegatedToRef)}
            className="ecos-timesheet__delegation-switch-checkbox"
            onToggle={this.handleToggleDelegated}
          />

          <span className="ecos-timesheet__delegation-switch-label">
            {t(description)}{' '}
            {delegatedToDisplayName && (
              <span
                className="ecos-timesheet__delegation-switch-label ecos-timesheet__delegation-switch-label_link"
                onClick={this.handleChangeDelegatedToUser}
              >
                {delegatedToDisplayName}
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  renderSelectUserModal() {
    const { delegatedToRef } = this.props;
    const { isOpenSelectUserModal } = this.state;

    return (
      <SelectUserModal
        getFullData
        defaultValue={delegatedToRef}
        isOpen={isOpenSelectUserModal}
        onSelect={this.handleSelectUser}
        onCancel={this.handleCloseSelectUserModal}
      />
    );
  }

  render() {
    const { currentDate } = this.state;
    const { isLoading, isLoadingStatus, isUpdatingStatus, status } = this.props;
    const noActionBtn = !status.taskId || !values(ServerStatusKeys).includes(status.key);

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(CommonLabels.TIMESHEET_TITLE)}</div>
            <RouteTypeTabs currentDate={currentDate} />
          </div>

          {this.renderDelegation()}
        </div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__date-settings">
            <DateSlider onChange={this.handleChangeCurrentDate.bind(this)} date={currentDate} />
          </div>

          <BlockStatus
            currentStatus={status.key}
            onChangeStatus={this.handleChangeStatus.bind(this)}
            noActionBtn={noActionBtn}
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
        {this.renderSelectUserModal()}
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
  popupMsg: get(state, 'timesheetMine.popupMsg', ''),
  delegatedToRef: get(state, 'timesheetMine.delegatedToRef', ''),
  delegatedToDisplayName: get(state, 'timesheetMine.delegatedToDisplayName', '')
});

const mapDispatchToProps = dispatch => ({
  getMyTimesheetByParams: payload => dispatch(getMyTimesheetByParams(payload)),
  resetMyTimesheet: payload => dispatch(resetMyTimesheet(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  setUpdatingStatus: payload => dispatch(setUpdatingStatus(payload)),
  modifyEventDayHours: payload => dispatch(modifyEventDayHours(payload)),
  resetEventDayHours: payload => dispatch(resetEventDayHours(payload)),
  getStatus: payload => dispatch(getStatus(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload)),
  delegateTo: payload => dispatch(delegateTo(payload)),
  removeDelegation: payload => dispatch(removeDelegation(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyTimesheetPage);
