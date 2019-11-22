import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import { connect } from 'react-redux';
import { Scrollbars } from 'react-custom-scrollbars';
import { t } from '../../helpers/util';
import { CommonLabels, DelegateTimesheetLabels } from '../../helpers/timesheet/dictionary';
import { DelegationTypes } from '../../constants/timesheet';
import { declineDelegation, getDelegatedDeputies, setDelegatedDeputies } from '../../actions/timesheet/delegated';
import { Loader } from '../common';
import { Btn } from '../common/btns';
import EcosModal from '../common/EcosModal';

import './style.scss';

const timesheetdlTypes = {
  [DelegationTypes.FILL]: 'delegationFilling',
  [DelegationTypes.APPROVE]: 'delegationApproval'
};

class DelegatedDeputiesModal extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    type: PropTypes.string,
    onClose: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    onClose: () => null
  };

  state = {
    deleted: []
  };

  componentDidMount() {
    const { type } = this.props;

    this.props.getDelegatedDeputies({ type: timesheetdlTypes[type] });
  }

  componentWillUnmount() {
    this.props.resetDelegatedDeputies();
  }

  handleCancel = () => {
    this.props.onClose();
  };

  confirmDeclineDelegationLocal = item => {
    const { deleted } = this.state;
    const { type } = this.props;

    this.props.declineDelegation({ userName: deleted, delegationType: type });
    this.onClose(true);
  };

  declineDelegationLocal = item => {
    const { deleted } = this.state;

    deleted.push(item.userName);

    this.setState({ deleted });
  };

  revertDelegationLocal = item => {
    const { deleted } = this.state;

    this.setState({ deleted: deleted.filter(del => del !== item.userName) });
  };

  onClose = () => {
    this.props.onClose();
  };

  render() {
    const { isOpen, deputyList, isLoadingDeputies } = this.props;
    const { deleted } = this.state;
    const isDeleted = userName => deleted.includes(userName);

    return (
      <EcosModal
        className="ecos-ts-deputy-list-modal ecos-modal_width-xs"
        title={DelegateTimesheetLabels.MODAL_DELEgGATED_SHEETS_TITLE}
        isOpen={isOpen}
        hideModal={this.handleCancel}
      >
        <Scrollbars
          style={{ height: '250px' }}
          className="ecos-ts-deputy-list__scroll"
          renderTrackVertical={props => <div {...props} className="ecos-ts-deputy-list__v-scroll" />}
        >
          {!isLoadingDeputies && (
            <div className="ecos-ts-deputy-list__box">
              {deputyList &&
                deputyList.map((item, i) => {
                  const deleted = isDeleted(item.userName);

                  return (
                    <div
                      className={classNames('ecos-ts-deputy-list__row', { 'ecos-ts-deputy-list__row_deleted': deleted })}
                      key={item.userName + i}
                    >
                      <div className="ecos-ts-deputy-list__cell ecos-ts-deputy-list__cell-user">
                        {`${item.userFullName} (${item.userName})`}
                      </div>
                      <div className="ecos-ts-deputy-list__cell ecos-ts-deputy-list__cell-btns ecos-ts-deputy-list__cell_hover">
                        {deleted && <span className="ecos-ts-deputy-list__label">{t(CommonLabels.DELETED)}</span>}
                        {!deleted && (
                          <Btn
                            className="ecos-ts-deputy-list-btn-cancel ecos-btn_red2 ecos-btn_narrow"
                            onClick={() => this.declineDelegationLocal(item)}
                          >
                            {t(CommonLabels.DELETE)}
                          </Btn>
                        )}
                        {deleted && (
                          <Btn
                            className="ecos-ts-deputy-list-btn-cancel ecos-btn_grey7 ecos-btn_narrow"
                            onClick={() => this.revertDelegationLocal(item)}
                          >
                            {t(CommonLabels.REVERT)}
                          </Btn>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          {!isLoadingDeputies && (!deputyList || !deputyList.length) && (
            <div className="ecos-ts-deputy-list__row ecos-ts-deputy-list__no-data">{t(CommonLabels.NO_DATA)}</div>
          )}
          {isLoadingDeputies && <Loader blur />}
        </Scrollbars>

        <div className="ecos-ts-deputy-list__buttons">
          <Btn className="ecos-ts-deputy-list__btn-cancel ecos-btn_grey7" onClick={this.onClose}>
            {t(CommonLabels.CANCEL)}
          </Btn>
          <Btn
            className={classNames('ecos-ts-deputy-list__btn-confirm ecos-btn_blue', { 'ecos-btn_disabled': !deleted.length })}
            onClick={this.confirmDeclineDelegationLocal}
            disabled={!deleted.length}
          >
            {t(CommonLabels.CONFIRM)}
          </Btn>
        </div>
      </EcosModal>
    );
  }
}

const mapStateToProps = state => ({
  isLoadingDeputies: get(state, 'timesheetDelegated.isLoadingDeputies', false),
  deputyList: get(state, 'timesheetDelegated.deputyList', false)
});

const mapDispatchToProps = dispatch => ({
  getDelegatedDeputies: payload => dispatch(getDelegatedDeputies(payload)),
  resetDelegatedDeputies: () => dispatch(setDelegatedDeputies([])),
  declineDelegation: payload => dispatch(declineDelegation(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DelegatedDeputiesModal);
