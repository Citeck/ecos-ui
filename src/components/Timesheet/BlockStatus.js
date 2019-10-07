import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { t } from '../../helpers/util';
import { CommonLabels, StatusesServerKeys } from '../../helpers/timesheet/constants';
import { Btn, IcoBtn } from '../../components/common/btns';
import EventHistoryModal from './EventHistoryModal';

import './style.scss';

class BlockStatus extends React.Component {
  static propTypes = {
    currentStatus: PropTypes.string,
    onChangeStatus: PropTypes.func
  };

  state = {
    isOpenModalEventHistory: false
  };

  handleChangeStatus = newStatus => {
    this.props.onChangeStatus && this.props.onChangeStatus(newStatus);
  };

  openModalEventHistory = () => {
    this.setState({ isOpenModalEventHistory: true });
  };

  closeModalEventHistory = () => {
    this.setState({ isOpenModalEventHistory: false });
  };

  openReadComment = () => {};

  renderCommonViewStatus({ value, outcome, btn, hasMsg }) {
    return (
      <>
        {value && (
          <div className={classnames('ecos-timesheet__status-value', { 'ecos-timesheet__status-value_warning': hasMsg })}>{t(value)}</div>
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
        {outcome && (
          <Btn className="ecos-timesheet__status-btn-change ecos-btn_blue" onClick={this.handleChangeStatus.bind(null, outcome)}>
            {t(btn)}
          </Btn>
        )}
      </>
    );
  }

  render() {
    const { isOpenModalEventHistory } = this.state;
    const { currentStatus } = this.props;
    let content = null;

    switch (currentStatus) {
      case StatusesServerKeys.NOT_FILLED:
        content = this.renderCommonViewStatus({
          value: CommonLabels.STATUS_VAL_NOT_FILLED,
          outcome: StatusesServerKeys.MANAGER_APPROVAL,
          btn: CommonLabels.STATUS_BTN_SENT_APPROVE
        });
        break;
      case StatusesServerKeys.MANAGER_APPROVAL:
      case StatusesServerKeys.APPROVED_BY_MANAGER:
        content = this.renderCommonViewStatus({
          value: CommonLabels.STATUS_VAL_WAITING_APPROVAL,
          outcome: StatusesServerKeys.NOT_FILLED,
          btn: CommonLabels.STATUS_BTN_SENT_IMPROVE
        });
        break;
      case StatusesServerKeys.CORRECTION:
        content = this.renderCommonViewStatus({
          value: CommonLabels.STATUS_VAL_NEED_IMPROVED,
          outcome: StatusesServerKeys.MANAGER_APPROVAL,
          btn: CommonLabels.STATUS_BTN_SENT_APPROVE,
          hasMsg: true
        });
        break;
      case StatusesServerKeys.APPROVED_BY_HR:
        content = this.renderCommonViewStatus({
          value: CommonLabels.STATUS_VAL_APPROVED
        });
        break;
      default:
        content = this.renderCommonViewStatus({
          value: currentStatus || CommonLabels.STATUS_VAL_NONE
        });
    }

    return (
      <>
        <EventHistoryModal onClose={this.closeModalEventHistory} isOpen={isOpenModalEventHistory} />
        <div className="ecos-timesheet__status">
          <div className="ecos-timesheet__status-title">{t(CommonLabels.STATUS_LBL)}</div>
          {content}
        </div>
      </>
    );
  }
}

export default BlockStatus;
