import React from 'react';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { t } from '../../helpers/util';
import { BaseConfigGroupButtons } from '../../helpers/timesheet/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import { ServerStatusKeys, ServerStatusOutcomeKeys, TimesheetTypes } from '../../constants/timesheet';
import {
  getSubordinatesTimesheetByParams,
  modifyEventDayHours,
  modifyStatus,
  resetEventDayHours,
  resetSubordinatesTimesheet,
  setPopupMessage
} from '../../actions/timesheet/subordinates';
import CommonTimesheetService from '../../services/timesheet/common';

import { Loader } from '../../components/common';
import { Switch } from '../../components/common/form';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';
import BaseTimesheetPage from './BaseTimesheetPage';

class SubordinatesTimesheetPage extends BaseTimesheetPage {
  constructor(props) {
    super(props);

    this.state.statusTabs = CommonTimesheetService.getStatusFilters(TimesheetTypes.SUBORDINATES);
  }

  componentDidMount() {
    this.getData();
  }

  componentWillUnmount() {
    this.props.resetSubordinatesTimesheet();
  }

  get lockDescription() {
    const { isDelegated } = this.state;

    if (isDelegated) {
      return t(SubTimesheetLabels.LOCK_DESCRIPTION_1);
    }

    return '';
  }

  get configGroupBtns() {
    const status = this.selectedStatus;
    const key = Array.isArray(status.key) ? status.key[0] : status.key;

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

  getData = () => {
    const { currentDate } = this.state;

    this.props.getSubordinatesTimesheetByParams({ currentDate });
  };

  handleChangeCurrentDate(currentDate) {
    super.handleChangeCurrentDate(currentDate, this.getData);
  }

  handleChangeStatus = (data, outcome) => {
    const { currentDate } = this.state;
    const { taskId, userName, comment = '' } = data;

    this.props.modifyStatus && this.props.modifyStatus({ outcome, taskId, userName, currentDate, comment });
  };

  handleToggleDelegated(isDelegated) {
    this.setState({ isDelegated });
  }

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
          eventTypes={filteredList}
          daysOfMonth={daysOfMonth}
          isAvailable={!isDelegated}
          lockedMessage={this.lockDescription}
          configGroupBtns={this.configGroupBtns}
          onChangeHours={this.handleChangeEventDayHours.bind(this)}
          onResetHours={this.handleResetEventDayHours.bind(this)}
          updatingHours={updatingHours}
        />
      );
    }

    return isLoading ? null : this.renderNoData();
  };

  render() {
    const { sheetTabs, isDelegated, currentDate, statusTabs } = this.state;
    const { isLoading } = this.props;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(CommonLabels.TIMESHEET_TITLE)}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab.bind(this)} />
            </div>
          </div>

          <div className="ecos-timesheet__column ecos-timesheet__delegation">
            <div className="ecos-timesheet__delegation-title">{t(CommonLabels.HEADLINE_DELEGATION)}</div>

            <div className="ecos-timesheet__delegation-switch">
              <Switch
                checked={isDelegated}
                className="ecos-timesheet__delegation-switch-checkbox"
                onToggle={this.handleToggleDelegated.bind(this)}
              />

              <span className="ecos-timesheet__delegation-switch-label">{t(SubTimesheetLabels.DELEGATION_DESCRIPTION_1)}</span>
            </div>
          </div>
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

          <div className="ecos-timesheet__white-block">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab.bind(this)} />
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
  mergedList: get(state, 'timesheetSubordinates.mergedList', []),
  isLoading: get(state, 'timesheetSubordinates.isLoading', false),
  updatingHours: get(state, 'timesheetSubordinates.updatingHours', {}),
  popupMsg: get(state, 'timesheetSubordinates.popupMsg', '')
});

const mapDispatchToProps = dispatch => ({
  getSubordinatesTimesheetByParams: payload => dispatch(getSubordinatesTimesheetByParams(payload)),
  resetSubordinatesTimesheet: payload => dispatch(resetSubordinatesTimesheet(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  modifyEventDayHours: payload => dispatch(modifyEventDayHours(payload)),
  resetEventDayHours: payload => dispatch(resetEventDayHours(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubordinatesTimesheetPage);
