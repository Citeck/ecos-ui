import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { t } from '../../helpers/util';
import { BaseConfigGroupButtons } from '../../helpers/timesheet/util';
import {
  CommonLabels,
  ServerStatusKeys,
  ServerStatusOutcomeKeys,
  TimesheetTypes,
  VerifyTimesheetLabels
} from '../../helpers/timesheet/constants';
import { getVerificationTimesheetByParams, initVerificationTimesheetStart, setPopupMessage } from '../../actions/timesheet/verification';
import CommonTimesheetService from '../../services/timesheet/common';

import { Loader } from '../../components/common';
import { TunableDialog } from '../../components/common/dialogs';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';
import BaseTimesheetPage from './BaseTimesheetPage';

const mapStateToProps = state => ({
  mergedList: get(state, ['timesheetVerification', 'mergedList'], []),
  isLoading: get(state, ['timesheetVerification', 'isLoading'], false),
  popupMsg: get(state, ['timesheetVerification', 'popupMsg'], '')
});

const mapDispatchToProps = dispatch => ({
  initVerificationTimesheetStart: payload => dispatch(initVerificationTimesheetStart(payload)),
  getVerificationTimesheetByParams: payload => dispatch(getVerificationTimesheetByParams(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload))
});

class VerificationTimesheetPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    this.state.sheetTabs = null;
    this.state.isDelegated = null;

    this.state.statusTabs = CommonTimesheetService.getStatusFilters(TimesheetTypes.VERIFICATION);
  }

  componentDidMount() {
    this.props.initVerificationTimesheetStart && this.props.initVerificationTimesheetStart({ status: this.selectedStatus.key });
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
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.SEND_BACK)
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
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.SEND_BACK)
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
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.SEND_BACK)
          },
          {}
        ];
      default:
        return [{}, {}];
    }
  }

  getData() {
    const { currentDate } = this.state;
    const status = this.selectedStatus.key;

    this.props.getVerificationTimesheetByParams && this.props.getVerificationTimesheetByParams({ currentDate, status });
  }

  handleChangeCurrentDate = currentDate => {
    super.handleChangeCurrentDate(currentDate);
  };

  handleChangeStatusTab = tabIndex => {
    super.handleChangeStatusTab(tabIndex, this.getData);
  };

  renderTimesheet = () => {
    const { daysOfMonth, statusTabs } = this.state;
    const { mergedList } = this.props;

    return (
      <Timesheet groupBy={'user'} eventTypes={mergedList} daysOfMonth={daysOfMonth} configGroupBtns={this.configGroupBtns} isAvailable />
    );
  };

  render() {
    const { dateTabs, currentDate, statusTabs } = this.state;
    const { isLoading, popupMsg } = this.props;

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
            <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
          </div>

          <div className="ecos-timesheet__status">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab} classNameItem="ecos-timesheet__status-tabs-item" />
          </div>
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
)(VerificationTimesheetPage);
