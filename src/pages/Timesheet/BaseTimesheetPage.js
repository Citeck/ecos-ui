import React from 'react';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import isFunction from 'lodash/isFunction';

import { t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import { getDaysOfMonth, getNewDateByDayNumber } from '../../helpers/timesheet/util';
import CommonTimesheetService from '../../services/timesheet/common';
import { TunableDialog } from '../../components/common/dialogs';
import { CommentModal } from '../../components/Timesheet';

import './style.scss';

class BaseTimesheetPage extends React.Component {
  constructor(props) {
    super(props);

    this.cacheDays = new Map();

    this.state = {
      currentDate: new Date(),
      dateTabs: CommonTimesheetService.getPeriodFiltersTabs(),
      statusTabs: [],
      daysOfMonth: this.getDaysOfMonth(new Date()),
      isDelegated: false,
      turnOnTimerPopup: false,
      isOpenCommentModal: false,
      isOpenSelectUserModal: false,
      currentTimesheetData: null
    };
  }

  get selectedStatus() {
    const { statusTabs } = this.state;

    return statusTabs.find(item => item.isActive) || {};
  }

  get configGroupBtns() {
    return [{}, {}];
  }

  componentWillReceiveProps(nextProps, nextContext) {
    const { popupMsg } = nextProps;

    this.resetPopupMsgTimer(popupMsg);
  }

  getDaysOfMonth = currentDate => {
    const days = getDaysOfMonth(currentDate);

    return days;
  };

  resetPopupMsgTimer(popupMsg) {
    const { turnOnTimerPopup } = this.state;

    if (!!popupMsg && !turnOnTimerPopup) {
      this.setState({ turnOnTimerPopup: true });
      debounce(() => {
        this.handleClosePopup();
        this.setState({ turnOnTimerPopup: false });
      }, 10000)();
    }
  }

  handleClosePopup() {
    const { setPopupMessage } = this.props;

    if (isFunction(setPopupMessage)) {
      setPopupMessage('');
    }
  }

  handleChangeActiveDateTab(tabIndex) {
    const dateTabs = cloneDeep(this.state.dateTabs);

    dateTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ dateTabs });
  }

  handleChangeStatusTab(tabIndex, callback = () => null) {
    const statusTabs = cloneDeep(this.state.statusTabs);

    statusTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ statusTabs }, callback);
  }

  handleChangeCurrentDate(currentDate, callback = () => null) {
    this.setState({ currentDate, daysOfMonth: this.getDaysOfMonth(currentDate) }, callback);
  }

  handleChangeEventDayHours(data) {
    const { type: eventType, number, value, userName } = data;
    const date = getNewDateByDayNumber(this.state.currentDate, number);

    this.props.modifyEventDayHours && this.props.modifyEventDayHours({ value, date, eventType, number, userName });
  }

  handleResetEventDayHours(data) {
    const { type: eventType, number, value, userName } = data;
    const date = getNewDateByDayNumber(this.state.currentDate, number);

    this.props.resetEventDayHours && this.props.resetEventDayHours({ value, date, eventType, number, userName });
  }

  handleGetCalendarEvents = userName => {
    const { getCalendarEvents } = this.props;
    const { currentDate } = this.state;

    getCalendarEvents({
      userName,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    });
  };

  clearCommentModalData() {
    this.setState({
      isOpenCommentModal: false,
      currentTimesheetData: null
    });
  }

  handleCloseCommentModal = () => {
    this.clearCommentModalData();
  };

  handleOpenCommentModal = (data = {}) => {
    this.setState({
      isOpenCommentModal: true,
      currentTimesheetData: cloneDeep(data)
    });
  };

  handleSendCommentModal = comment => {
    const { outcome, ...data } = this.state.currentTimesheetData || {};

    this.handleChangeStatus({ ...data, comment }, outcome);
    this.clearCommentModalData();
  };

  renderNoData() {
    return (
      <div className="ecos-timesheet__white-block">
        <div className="ecos-timesheet__no-data">{CommonLabels.NO_DATA_BY_FILTERS}</div>
      </div>
    );
  }

  renderCommentModal(isRequired = false) {
    const { isOpenCommentModal } = this.state;

    return (
      <CommentModal
        isOpen={isOpenCommentModal}
        isRequired={isRequired}
        onCancel={this.handleCloseCommentModal}
        onSend={this.handleSendCommentModal}
      />
    );
  }

  renderPopupMessage() {
    const { popupMsg } = this.props;

    return (
      <TunableDialog isOpen={!!popupMsg} content={popupMsg} onClose={this.handleClosePopup.bind(this)} title={t(CommonLabels.NOTICE)} />
    );
  }

  render() {
    return null;
  }
}

export default BaseTimesheetPage;
