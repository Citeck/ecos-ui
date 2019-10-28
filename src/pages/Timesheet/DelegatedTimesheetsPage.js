import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { deepClone, t } from '../../helpers/util';
import { CommonLabels, DelegateTimesheetLabels } from '../../helpers/timesheet/dictionary';
import { DelegationTypes, ServerStatusKeys, ServerStatusOutcomeKeys, TimesheetTypes } from '../../constants/timesheet';
import { BaseConfigGroupButtons } from '../../helpers/timesheet/util';
import CommonTimesheetService from '../../services/timesheet/common';
import DelegatedTimesheetService from '../../services/timesheet/delegated';
import {
  declineDelegation,
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
import DelegatedDeputiesModal from '../../components/Timesheet/DelegatedDeputiesModal';

const initDType = DelegationTypes.FILL;
const initStatus = ServerStatusKeys.CORRECTION;

class DelegatedTimesheetsPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    const delegationTypes = DelegatedTimesheetService.getDelegationType();

    this.state.statusTabs = CommonTimesheetService.getStatusFilters(TimesheetTypes.DELEGATED, initDType);
    this.state.currentStatus = initStatus;
    this.state.delegationTypeTabs = delegationTypes.map(item => ({ ...item, isActive: initDType === item.type }));
    this.state.delegatedTo = '';
    this.state.delegationRejected = true;
    this.state.isOpenDeputiesModal = false;
  }

  componentDidMount() {
    this.getData();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    super.componentWillReceiveProps(nextProps, nextContext);

    const { innerCounts } = this.props;
    const badge = key => (nextProps.isLoading ? '• • •' : nextProps.innerCounts[key] || 0);

    if (JSON.stringify(innerCounts) !== JSON.stringify(nextProps.innerCounts)) {
      const delegationTypeTabs = this.state.delegationTypeTabs.map(item => ({
        ...item,
        badge: badge(item.type)
      }));

      const sheetTabs = this.state.sheetTabs.map(item => ({
        ...item,
        badge: item.key === TimesheetTypes.DELEGATED ? badge('all') : null
      }));

      this.setState({ delegationTypeTabs, sheetTabs });
    }
  }

  componentWillUnmount() {
    this.props.resetDelegatedTimesheet();
  }

  get selectedDType() {
    const { delegationTypeTabs } = this.state;

    return (delegationTypeTabs.find(item => item.isActive) || {}).type;
  }

  get configGroupBtns() {
    const status = this.selectedStatus;
    const delegationType = this.selectedDType;
    const key = Array.isArray(status.key) ? status.key[0] : status.key;

    if (delegationType === DelegationTypes.FILL) {
      const fillingBtns = [];

      fillingBtns.push({
        id: 'ecos-timesheet__table-group-btn_off-delegation_id',
        className: 'ecos-timesheet__table-group-btn_off-delegation',
        title: t(CommonLabels.STATUS_BTN_OFF_DELEGATION),
        onClick: data => this.handleClickOffDelegation(data)
      });

      if (key === ServerStatusKeys.MANAGER_APPROVAL) {
        fillingBtns.push({});
      } else {
        fillingBtns.push({
          ...BaseConfigGroupButtons.SENT_APPROVE,
          onClick: data => this.handleOpenCommentModal({ ...data, outcome: ServerStatusOutcomeKeys.TASK_DONE })
        });
      }

      return fillingBtns;
    }

    if (delegationType === DelegationTypes.APPROVE) {
      switch (key) {
        case ServerStatusKeys.NOT_FILLED:
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
        default:
          return [{}, {}];
      }
    }

    return [{}, {}];
  }

  getData = () => {
    const { currentDate } = this.state;
    const delegationType = this.selectedDType;
    const status = this.selectedStatus.key;

    this.props.getDelegatedTimesheetByParams &&
      this.props.getDelegatedTimesheetByParams({
        currentDate,
        delegationType,
        status
      });
  };

  handleChangeCurrentDate(currentDate) {
    super.handleChangeCurrentDate(currentDate, this.getData);
  }

  handleChangeDTypeTab(tabIndex) {
    const delegationTypeTabs = deepClone(this.state.delegationTypeTabs);
    let selectedDType = '';

    delegationTypeTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;

      if (tab.isActive) {
        selectedDType = tab.type;
      }
    });

    const statusTabs = CommonTimesheetService.getStatusFilters(TimesheetTypes.DELEGATED, selectedDType);

    this.setState({ delegationTypeTabs, statusTabs }, this.getData);
  }

  handleChangeStatusTab(tabIndex) {
    super.handleChangeStatusTab(tabIndex, this.getData);
  }

  handleClickOffDelegation = data => {
    const { userName } = data;
    const delegationType = this.selectedDType;

    this.props.declineDelegation && this.props.declineDelegation({ userName, delegationType });
  };

  handleChangeStatus = (data, outcome) => {
    const { taskId, userName, comment = '' } = data;

    this.props.modifyStatus && this.props.modifyStatus({ outcome, taskId, userName, comment });
  };

  handleOpenDeputiesModal = () => {
    this.setState({ isOpenDeputiesModal: true });
  };

  handleCloseDeputiesModal = isNeedUpdate => {
    this.setState({ isOpenDeputiesModal: false });

    if (isNeedUpdate) {
      this.getData();
    }
  };

  renderTimesheet = () => {
    const { daysOfMonth, isDelegated } = this.state;
    const { mergedList, updatingHours } = this.props;

    return (
      <Timesheet
        groupBy={'user'}
        configGroupBtns={this.configGroupBtns}
        eventTypes={mergedList}
        daysOfMonth={daysOfMonth}
        isAvailable={!isDelegated}
        lockedMessage={this.lockDescription}
        onChangeHours={this.handleChangeEventDayHours.bind(this)}
        onResetHours={this.handleResetEventDayHours.bind(this)}
        updatingHours={updatingHours}
      />
    );
  };

  render() {
    const { sheetTabs, currentDate, statusTabs, delegationTypeTabs, currentTimesheetData, isOpenDeputiesModal } = this.state;
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

          {this.selectedDType === DelegationTypes.APPROVE && (
            <div className="ecos-timesheet__column ecos-timesheet__delegation">
              <div className="ecos-timesheet__delegation-title">
                {t(CommonLabels.HEADLINE_DELEGATION)}
                <Btn className="ecos-timesheet__delegation-btn-set ecos-btn_grey7 ecos-btn_narrow" onClick={this.handleOpenDeputiesModal}>
                  {t(DelegateTimesheetLabels.DELEGATION_BTN_SET)}
                </Btn>
              </div>

              <div className="ecos-timesheet__delegation-label">{t(DelegateTimesheetLabels.DELEGATION_DESCRIPTION_1)}</div>
            </div>
          )}
        </div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__header-box">
            <div className="ecos-timesheet__white-block">
              <Tabs tabs={delegationTypeTabs} isSmall onClick={this.handleChangeDTypeTab.bind(this)} />
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
        {isOpenDeputiesModal && <DelegatedDeputiesModal onClose={this.handleCloseDeputiesModal} isOpen type={this.selectedDType} />}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  mergedList: get(state, 'timesheetDelegated.mergedList', []),
  innerCounts: get(state, 'timesheetDelegated.innerCounts', []),
  updatingHours: get(state, 'timesheetDelegated.updatingHours', {}),
  isLoading: get(state, 'timesheetDelegated.isLoading', false),
  popupMsg: get(state, 'timesheetDelegated.popupMsg', '')
});

const mapDispatchToProps = dispatch => ({
  getDelegatedTimesheetByParams: payload => dispatch(getDelegatedTimesheetByParams(payload)),
  resetDelegatedTimesheet: payload => dispatch(resetDelegatedTimesheet(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  declineDelegation: payload => dispatch(declineDelegation(payload)),
  modifyEventDayHours: payload => dispatch(modifyEventDayHours(payload)),
  resetEventDayHours: payload => dispatch(resetEventDayHours(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DelegatedTimesheetsPage);
