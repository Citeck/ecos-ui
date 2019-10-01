import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../helpers/util';
import { CommonLabels, Statuses } from '../../helpers/timesheet/constants';
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

  renderCommonViewStatus(currentStatusLbl, changeStatus, changeStatusLbl) {
    return (
      <>
        <div className="ecos-timesheet__status-value">{t(currentStatusLbl)}</div>
        <IcoBtn icon="icon-calendar" className="ecos-timesheet__status-btn-history" onClick={this.openModalEventHistory}>
          {t(CommonLabels.EVENT_HISTORY_BTN)}
        </IcoBtn>
        <Btn className="ecos-timesheet__status-btn-change ecos-btn_blue" onClick={this.handleChangeStatus.bind(null, changeStatus)}>
          {t(changeStatusLbl)}
        </Btn>
      </>
    );
  }

  render() {
    const { isOpenModalEventHistory } = this.state;
    const { currentStatus } = this.props;
    let content = null;

    switch (currentStatus) {
      case Statuses.NOT_FILLED:
        content = this.renderCommonViewStatus(
          CommonLabels.STATUS_VAL_NOT_FILLED,
          Statuses.WAITING_APPROVAL,
          CommonLabels.STATUS_SENT_APPROVAL
        );
        break;
      case Statuses.WAITING_APPROVAL:
        content = this.renderCommonViewStatus(CommonLabels.STATUS_VAL_WAITING_APPROVAL, Statuses.NOT_FILLED, CommonLabels.STATUS_IMPROVE);
        break;
      case Statuses.NEED_IMPROVED:
        content = this.renderCommonViewStatus(
          CommonLabels.STATUS_VAL_NEED_IMPROVED,
          Statuses.WAITING_APPROVAL,
          CommonLabels.STATUS_SENT_APPROVAL
        );
        break;
      default:
        content = null;
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
