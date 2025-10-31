import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import values from 'lodash/values';

import { t } from '../../helpers/util';
import { CommonLabels } from '../../helpers/timesheet/dictionary';
import { ServerStatusKeys } from '../../constants/timesheet';

import { PointsLoader } from '../common';
import { Btn, IcoBtn } from '../../components/common/btns';
import EventHistoryModal from './EventHistoryModal';

import './style.scss';

class BlockStatus extends React.Component {
  static propTypes = {
    currentStatus: PropTypes.string,
    record: PropTypes.string,
    comment: PropTypes.string,
    onChangeStatus: PropTypes.func,
    noActionBtn: PropTypes.bool,
    isLoading: PropTypes.bool
  };

  state = {
    isOpenModalEventHistory: false
  };

  handleChangeStatus = () => {
    this.props.onChangeStatus && this.props.onChangeStatus();
  };

  openModalEventHistory = () => {
    this.setState({ isOpenModalEventHistory: true });
  };

  closeModalEventHistory = () => {
    this.setState({ isOpenModalEventHistory: false });
  };

  getEmptyBlock = () => {
    return <div className="ecos-timesheet__empty-btn ecos-timesheet__empty-btn_normal ecos-timesheet__status-btn_none" />;
  };

  getCommonViewStatus = ({ value, btn, attention }) => {
    const { noActionBtn } = this.props;

    return (
      <>
        {value && (
          <div className={classNames('ecos-timesheet__status-value', { 'ecos-timesheet__status-value_warning': attention })}>
            {t(value)}
          </div>
        )}
        <IcoBtn icon="icon-calendar" className={classNames('ecos-timesheet__status-btn-history')} onClick={this.openModalEventHistory}>
          {t(CommonLabels.EVENT_HISTORY_BTN)}
        </IcoBtn>
        {/*{attention && (
          <IcoBtn icon="icon-notify" className="ecos-timesheet__status-btn-comment ecos-btn_red2" onClick={this.openModalEventHistory}>
            {t(CommonLabels.TO_READ_COMMENT_BTN)}
          </IcoBtn>
        )}*/}
        {btn && !noActionBtn && (
          <Btn className="ecos-timesheet__status-btn-change ecos-btn_blue" onClick={this.handleChangeStatus}>
            {t(btn)}
          </Btn>
        )}
        {(!btn || noActionBtn) && this.getEmptyBlock()}
      </>
    );
  };

  renderViewStatus = () => {
    let { currentStatus } = this.props;

    currentStatus = values(ServerStatusKeys).includes(currentStatus) ? currentStatus : null;

    switch (currentStatus) {
      case ServerStatusKeys.NULL:
        return this.getCommonViewStatus({ value: CommonLabels.STATUS_VAL_NOT_FILLED });
      case ServerStatusKeys.NOT_FILLED:
        return this.getCommonViewStatus({
          value: CommonLabels.STATUS_VAL_NOT_FILLED,
          btn: CommonLabels.STATUS_BTN_SENT_APPROVE
        });
      case ServerStatusKeys.MANAGER_APPROVAL:
        return this.getCommonViewStatus({
          value: CommonLabels.STATUS_VAL_WAITING_APPROVAL,
          btn: CommonLabels.STATUS_BTN_SENT_IMPROVE
        });
      case ServerStatusKeys.APPROVED_BY_MANAGER:
        return this.getCommonViewStatus({
          value: CommonLabels.STATUS_VAL_APPROVED_BY_MANAGER,
          btn: CommonLabels.STATUS_BTN_SENT_IMPROVE
        });
      case ServerStatusKeys.CORRECTION:
        return this.getCommonViewStatus({
          value: CommonLabels.STATUS_VAL_NEED_IMPROVED,
          btn: CommonLabels.STATUS_BTN_SENT_APPROVE,
          attention: true
        });
      case ServerStatusKeys.APPROVED_BY_HR:
        return this.getCommonViewStatus({ value: CommonLabels.STATUS_VAL_APPROVED });
      case ServerStatusKeys.SENT_TO_ACCOUNTING_SYSTEM:
        return this.getCommonViewStatus({ value: CommonLabels.STATUS_VAL_SENT_TO_ACCOUNTING_SYSTEM });
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
        {this.getEmptyBlock()}
      </>
    );
  };

  render() {
    const { isOpenModalEventHistory } = this.state;
    const { isLoading, record, comment } = this.props;

    return (
      <>
        <EventHistoryModal onClose={this.closeModalEventHistory} isOpen={isOpenModalEventHistory} record={record} comment={comment} />
        <div className="ecos-timesheet__status">
          <div className="ecos-timesheet__status-title">{t(CommonLabels.STATUS_LBL)}</div>
          {isLoading ? this.renderLoading() : this.renderViewStatus()}
        </div>
      </>
    );
  }
}

export default BlockStatus;
