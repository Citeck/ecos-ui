import React, { Component } from 'react';
import 'moment-business-days';
import get from 'lodash/get';
import { connect } from 'react-redux';

import { deepClone, t } from '../../helpers/util';
import { CommonLabels, MyTimesheetLabels, StatusesServerKeys } from '../../helpers/timesheet/constants';
import { getDaysOfMonth, isOnlyContent } from '../../helpers/timesheet/util';
import { getMyTimesheetByParams, initMyTimesheetStart, modifyStatus } from '../../actions/timesheet/mine';
import CommonTimesheetService from '../../services/timesheet/common';

import { Loader } from '../../components/common';
import { Switch } from '../../components/common/form';
import Timesheet, { BlockStatus, DateSlider, Tabs } from '../../components/Timesheet';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';

import './style.scss';

const mapStateToProps = state => ({
  isLoading: get(state, ['timesheetMine', 'isLoading'], false),
  isLoadingStatus: get(state, ['timesheetMine', 'isLoadingStatus'], false),
  status: get(state, ['timesheetMine', 'status'], false),
  mergedEvents: get(state, ['timesheetMine', 'mergedEvents'], false)
});

const mapDispatchToProps = dispatch => ({
  initMyTimesheetStart: payload => dispatch(initMyTimesheetStart(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  getMyTimesheetByParams: payload => dispatch(getMyTimesheetByParams(payload))
});

class MyTimesheetPage extends Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    this.cacheDays = new Map();

    this.state = {
      sheetTabs: CommonTimesheetService.getSheetTabs(this.isOnlyContent, location),
      dateTabs: CommonTimesheetService.getPeriodFiltersTabs(),
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date()),
      isDelegated: false,
      delegatedTo: '',
      delegationRejected: true
    };
  }

  componentDidMount() {
    this.props.initMyTimesheetStart();
  }

  get isOnlyContent() {
    return isOnlyContent(this.props);
  }

  getDaysOfMonth = currentDate => {
    //   if (this.cacheDays.has(currentDate)) {
    //     return this.cacheDays.get(currentDate);
    //   }
    const days = getDaysOfMonth(currentDate);
    //   this.cacheDays.set(currentDate, days);
    return days;
  };

  get lockDescription() {
    const { isDelegated } = this.state;
    const { status } = this.props;

    if (status.key === StatusesServerKeys.MANAGER_APPROVAL) {
      return t(MyTimesheetLabels.LOCK_DESCRIPTION_1);
    }

    if (isDelegated) {
      return t(MyTimesheetLabels.LOCK_DESCRIPTION_2);
    }

    return '';
  }

  handleChangeActiveSheetTab = tabIndex => {
    const sheetTabs = deepClone(this.state.sheetTabs);

    sheetTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;

      if (tab.isActive) {
        changeUrlLink(tab.link);
      }
    });

    this.setState({ sheetTabs });
  };

  handleChangeActiveDateTab = tabIndex => {
    const dateTabs = deepClone(this.state.dateTabs);

    dateTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ dateTabs });
  };

  handleChangeCurrentDate = currentDate => {
    this.setState({ currentDate, daysOfMonth: this.getDaysOfMonth(currentDate) });
    this.props.getMyTimesheetByParams && this.props.getMyTimesheetByParams({ currentDate });
  };

  handleChangeStatus = outcome => {
    const { status } = this.props;
    const { currentDate } = this.state;
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

  renderMyTimesheet = () => {
    const { daysOfMonth, isDelegated } = this.state;
    const { status, mergedEvents } = this.props;

    return (
      <Timesheet
        eventTypes={mergedEvents}
        daysOfMonth={daysOfMonth}
        isAvailable={status.key !== StatusesServerKeys.MANAGER_APPROVAL && !isDelegated}
        lockedMessage={this.lockDescription}
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
    const { isLoading, isLoadingStatus, status } = this.props;

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
            noActionBtn={!status.taskId || !StatusesServerKeys[status.key]}
            isLoading={isLoadingStatus}
          />
        </div>
        {isLoading ? <Loader className="ecos-timesheet__loader" height={100} width={100} /> : this.renderMyTimesheet()}
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyTimesheetPage);
