import React, { Component } from 'react';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import { connect } from 'react-redux';

import { deepClone, t } from '../../helpers/util';
import { getDaysOfMonth, getNewDateByDayNumber, isOnlyContent } from '../../helpers/timesheet/util';
import {
  CommonLabels,
  ServerStatusKeys,
  ServerStatusOutcomeKeys,
  SubTimesheetLabels,
  TimesheetTypes
} from '../../helpers/timesheet/constants';
import {
  getSubordinatesTimesheetByParams,
  initSubordinatesTimesheetStart,
  modifyEventDayHours,
  modifyStatus,
  setPopupMessage
} from '../../actions/timesheet/subordinates';
import CommonTimesheetService from '../../services/timesheet/common';

import { Loader } from '../../components/common';
import { Switch } from '../../components/common/form';
import { TunableDialog } from '../../components/common/dialogs';
import Timesheet, { DateSlider, Tabs } from '../../components/Timesheet';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';

import './style.scss';

const mapStateToProps = state => ({
  mergedList: get(state, ['timesheetSubordinates', 'mergedList'], []),
  isLoading: get(state, ['timesheetSubordinates', 'isLoading'], false),
  popupMsg: get(state, ['timesheetSubordinates', 'popupMsg'], '')
});

const mapDispatchToProps = dispatch => ({
  initSubordinatesTimesheetStart: payload => dispatch(initSubordinatesTimesheetStart(payload)),
  getSubordinatesTimesheetDate: payload => dispatch(getSubordinatesTimesheetByParams(payload)),
  modifyStatus: payload => dispatch(modifyStatus(payload)),
  modifyEventDayHours: payload => dispatch(modifyEventDayHours(payload)),
  setPopupMessage: payload => dispatch(setPopupMessage(payload))
});

class SubordinatesTimesheetPage extends Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    this.state = {
      sheetTabs: CommonTimesheetService.getSheetTabs(this.isOnlyContent, location),
      dateTabs: CommonTimesheetService.getPeriodFiltersTabs(),
      statusTabs: CommonTimesheetService.getStatusFilters(TimesheetTypes.SUBORDINATES),
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date()),
      isDelegated: false,
      turnOnTimerPopup: false
    };
  }

  componentDidMount() {
    this.props.initSubordinatesTimesheetStart();
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const { popupMsg } = nextProps;
    const { turnOnTimerPopup } = this.state;

    if (!!popupMsg && !turnOnTimerPopup) {
      this.setState({ turnOnTimerPopup: true });
      debounce(() => {
        this.handleClosePopup();
        this.setState({ turnOnTimerPopup: false });
      }, 10000)();
    }
  }

  get isOnlyContent() {
    return isOnlyContent(this.props);
  }

  get lockDescription() {
    const { isDelegated } = this.state;

    if (isDelegated) {
      return t(SubTimesheetLabels.LOCK_DESCRIPTION_1);
    }

    return '';
  }

  get selectedStatus() {
    const { statusTabs } = this.state;

    return statusTabs.find(item => item.isActive) || {};
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
            id: 'ecos-timesheet__table-group-btn_approve_id',
            className: 'ecos-timesheet__table-group-btn_approve',
            icon: 'icon-check',
            title: t(CommonLabels.STATUS_BTN_APPROVE),
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.TASK_DONE),
            tooltip: t(CommonLabels.STATUS_TIP_APPROVE_1)
          }
        ];
      case ServerStatusKeys.MANAGER_APPROVAL:
        return [
          {
            id: 'ecos-timesheet__table-group-btn_revision_id',
            className: 'ecos-timesheet__table-group-btn_revision',
            icon: 'icon-arrow-left',
            title: t(CommonLabels.STATUS_BTN_SENT_IMPROVE),
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.SEND_BACK),
            tooltip: t(CommonLabels.STATUS_TIP_SENT_IMPROVE_1)
          },
          {
            id: 'ecos-timesheet__table-group-btn_approve_id',
            className: 'ecos-timesheet__table-group-btn_approve',
            icon: 'icon-check',
            title: t(CommonLabels.STATUS_BTN_APPROVE),
            onClick: data => this.handleChangeStatus(data, ServerStatusOutcomeKeys.APPROVE),
            tooltip: t(CommonLabels.STATUS_TIP_APPROVE_1)
          }
        ];
      default:
        return [{}, {}];
    }
  }

  getDaysOfMonth = currentDate => {
    return getDaysOfMonth(currentDate);
  };

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
    this.props.getSubordinatesTimesheetDate && this.props.getSubordinatesTimesheetDate({ currentDate });
  };

  handleChangeStatusTab = tabIndex => {
    const statusTabs = deepClone(this.state.statusTabs);

    statusTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ statusTabs });
  };

  handleChangeStatus = (data, outcome) => {
    const { currentDate } = this.state;
    const { taskId, userName } = data;

    this.props.modifyStatus && this.props.modifyStatus({ outcome, taskId, userName, currentDate });
  };

  handleToggleDelegated = isDelegated => {
    this.setState({ isDelegated });
  };

  handleChangeEventDayHours = data => {
    debugger;
    const { type: eventType, number, value, userName } = data;
    const date = getNewDateByDayNumber(this.state.currentDate, number);

    this.props.modifyEventDayHours && this.props.modifyEventDayHours({ value, date, eventType, userName });
  };

  handleClosePopup = () => {
    this.props.setPopupMessage && this.props.setPopupMessage('');
  };

  renderSubordinateTimesheet = () => {
    const { daysOfMonth, isDelegated } = this.state;
    const { mergedList, isLoading } = this.props;

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
          onChangeHours={this.handleChangeEventDayHours}
        />
      );
    }

    return isLoading ? null : (
      <div className="ecos-timesheet__white-block">
        <div className="ecos-timesheet__no-data">{CommonLabels.NO_DATA}</div>
      </div>
    );
  };

  render() {
    const { sheetTabs, isDelegated, currentDate, statusTabs } = this.state;
    const { isLoading, popupMsg } = this.props;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__row">
          <div className="ecos-timesheet__column">
            <div className="ecos-timesheet__title">{t(CommonLabels.TIMESHEET_TITLE)}</div>

            <div className="ecos-timesheet__type">
              <Tabs tabs={sheetTabs} className="ecos-tabs-v2_bg-white" onClick={this.handleChangeActiveSheetTab} />
            </div>
          </div>

          <div className="ecos-timesheet__column ecos-timesheet__delegation">
            <div className="ecos-timesheet__delegation-title">{t(CommonLabels.HEADLINE_DELEGATION)}</div>

            <div className="ecos-timesheet__delegation-switch">
              <Switch checked={isDelegated} className="ecos-timesheet__delegation-switch-checkbox" onToggle={this.handleToggleDelegated} />

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
            <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
          </div>

          <div className="ecos-timesheet__white-block">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab} />
          </div>
        </div>
        <div className="ecos-timesheet__main-content">
          {isLoading && <Loader className="ecos-timesheet__loader" height={100} width={100} blur />}
          {this.renderSubordinateTimesheet()}
        </div>
        <TunableDialog isOpen={!!popupMsg} content={popupMsg} onClose={this.handleClosePopup} title={t(CommonLabels.NOTICE)} />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubordinatesTimesheetPage);
