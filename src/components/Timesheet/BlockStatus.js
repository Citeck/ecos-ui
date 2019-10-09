import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { t } from '../../helpers/util';
import { CommonLabels, StatusesServerKeys } from '../../helpers/timesheet/constants';
import CommonTimesheetService from '../../services/timesheet/common';

import { PointsLoader } from '../common';
import { Btn, IcoBtn } from '../../components/common/btns';
import EventHistoryModal from './EventHistoryModal';

import './style.scss';

class BlockStatus extends React.Component {
  static propTypes = {
    currentStatus: PropTypes.string,
    onChangeStatus: PropTypes.func,
    noActionBtn: PropTypes.bool,
    isLoading: PropTypes.bool
  };

  state = {
    isOpenModalEventHistory: false
  };

  handleChangeStatus = outcome => {
    this.props.onChangeStatus && this.props.onChangeStatus(outcome);
  };

  openModalEventHistory = () => {
    this.setState({ isOpenModalEventHistory: true });
  };

  closeModalEventHistory = () => {
    this.setState({ isOpenModalEventHistory: false });
  };

  openReadComment = () => {};

  getCommonViewStatus = ({ value, outcome, btn, hasMsg }) => {
    const { noActionBtn } = this.props;

    return (
      <>
        {value && (
          <div className={classNames('ecos-timesheet__status-value', { 'ecos-timesheet__status-value_warning': hasMsg })}>{t(value)}</div>
        )}
        {!hasMsg && (
          <IcoBtn icon="icon-calendar" className="ecos-timesheet__status-btn-history" onClick={this.openModalEventHistory}>
            {t(CommonLabels.EVENT_HISTORY_BTN)}
          </IcoBtn>
        )}
        {hasMsg && (
          <IcoBtn icon="icon-notify-dialogue" className="ecos-timesheet__status-btn-comment ecos-btn_red2" onClick={this.openReadComment}>
            {t(CommonLabels.TO_READ_COMMENT_BTN)}
          </IcoBtn>
        )}
        {outcome && !noActionBtn && (
          <Btn className="ecos-timesheet__status-btn-change ecos-btn_blue" onClick={this.handleChangeStatus.bind(null, outcome)}>
            {t(btn)}
          </Btn>
        )}
        {noActionBtn && <div className="ecos-timesheet__empty-btn ecos-timesheet__empty-btn_normal ecos-timesheet__status-btn_none" />}
      </>
    );
  };

  renderViewStatus = () => {
    let { currentStatus } = this.props;
    const outcome = CommonTimesheetService.getOutcomeStatusByCurrent(currentStatus);

    currentStatus = StatusesServerKeys[currentStatus] || null;

    switch (currentStatus) {
      case StatusesServerKeys.NULL:
        return this.getCommonViewStatus({ value: CommonLabels.STATUS_VAL_NOT_FILLED });
      case StatusesServerKeys.NOT_FILLED:
        return this.getCommonViewStatus({
          value: CommonLabels.STATUS_VAL_NOT_FILLED,
          outcome,
          btn: CommonLabels.STATUS_BTN_SENT_APPROVE
        });
      case StatusesServerKeys.MANAGER_APPROVAL:
      case StatusesServerKeys.APPROVED_BY_MANAGER:
        return this.getCommonViewStatus({
          value: CommonLabels.STATUS_VAL_WAITING_APPROVAL,
          outcome,
          btn: CommonLabels.STATUS_BTN_SENT_IMPROVE
        });
      case StatusesServerKeys.CORRECTION:
        return this.getCommonViewStatus({
          value: CommonLabels.STATUS_VAL_NEED_IMPROVED,
          outcome,
          btn: CommonLabels.STATUS_BTN_SENT_APPROVE,
          hasMsg: true
        });
      case StatusesServerKeys.APPROVED_BY_HR:
        return this.getCommonViewStatus({ value: CommonLabels.STATUS_VAL_APPROVED });
      default:
        return this.getCommonViewStatus({ value: CommonLabels.STATUS_VAL_NONE });
    }
  };

  renderLoading = () => {
    return (
      <>
        <div className="ecos-timesheet__status-value ecos-timesheet__status-value_loading">
          <PointsLoader className="ecos-timesheet__status-loader" />
        </div>
        <div className="ecos-timesheet__empty-btn ecos-timesheet__empty-btn_normal ecos-timesheet__status-loading" />
      </>
    );
  };

  render() {
    const { isOpenModalEventHistory } = this.state;
    const { isLoading } = this.props;

    return (
      <>
        <EventHistoryModal onClose={this.closeModalEventHistory} isOpen={isOpenModalEventHistory} />
        <div className="ecos-timesheet__status">
          <div className="ecos-timesheet__status-title">{t(CommonLabels.STATUS_LBL)}</div>
          {isLoading ? this.renderLoading() : this.renderViewStatus()}
        </div>
      </>
    );
  }
}

export default BlockStatus;
