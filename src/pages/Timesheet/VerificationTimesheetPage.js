import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { deepClone, t } from '../../helpers/util';
import { BaseConfigGroupButtons } from '../../helpers/timesheet/util';
import { CommonLabels, ServerStatusKeys, ServerStatusOutcomeKeys, VerifyTimesheetLabels } from '../../helpers/timesheet/constants';
import { getVerificationTimesheetByParams, initVerificationTimesheetStart, setPopupMessage } from '../../actions/timesheet/verification';

import BaseTimesheetPage from './BaseTimesheetPage';
import { Loader } from '../../components/common';
import { TunableDialog } from '../../components/common/dialogs';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';

import './style.scss';

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

  handleChangeActiveDateTab = tabIndex => {
    const dateTabs = deepClone(this.state.dateTabs);

    dateTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ dateTabs });
  };

  handleChangeCurrentDate = currentDate => {
    this.setState({ currentDate, daysOfMonth: this.getDaysOfMonth(currentDate) }, this.getData);
  };

  handleChangeStatusTab = tabIndex => {
    const statusTabs = deepClone(this.state.statusTabs);

    statusTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ statusTabs }, this.getData);
  };

  renderTimesheet = () => {
    const { daysOfMonth, statusTabs } = this.state;
    const { mergedList } = this.props;

    return (
      <Timesheet groupBy={'user'} eventTypes={mergedList} daysOfMonth={daysOfMonth} configGroupBtns={this.configGroupBtns} isAvailable />
    );
  };

  render() {
    const { sheetTabs, dateTabs, currentDate, statusTabs } = this.state;
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
