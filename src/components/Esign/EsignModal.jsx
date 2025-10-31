import React, { Component } from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import PropTypes from 'prop-types';

import { Btn } from '../common/btns';
import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';
import { Labels } from '../../constants/esign';

class EsignModal extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    isLoading: PropTypes.bool,
    title: PropTypes.string,
    onHideModal: PropTypes.func,
    onSign: PropTypes.func,
    certificates: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        thumbprint: PropTypes.string,
        subject: PropTypes.string,
        issuer: PropTypes.string,
        dateFrom: PropTypes.string,
        dateTo: PropTypes.string,
        provider: PropTypes.string,
        name: PropTypes.string,
        friendlySubjectInfo: PropTypes.array,
        friendlyIssuerInfo: PropTypes.array
      })
    ),
    selected: PropTypes.string
  };

  static defaultProps = {
    title: '',
    selected: '',
    certificates: []
  };

  constructor(props) {
    super(props);

    this.state = {
      selected: props.selected || ''
    };
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (!state.selected && props.selected) {
      newState.selected = props.selected;
    }

    if (!props.isOpen && props.selected) {
      newState.selected = '';
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  handleHideModal = () => {
    this.props.onHideModal();
    this.setState({ selected: '' });
  };

  handleSelectCertificate = selected => {
    this.setState({ selected });
  };

  handleSignDocument = () => {
    const { certificates } = this.props;

    this.props.onSign(certificates.find(certificate => certificate.id === this.state.selected));
  };

  renderList() {
    const { certificates } = this.props;

    if (!certificates) {
      return null;
    }

    const { selected } = this.state;

    return (
      <div className="esign-cert__list">
        <Scrollbars
          autoHeight
          autoHeightMin={40}
          autoHeightMax={124}
          renderTrackVertical={props => <div {...props} className="esign-cert__list-track-vertical" />}
          renderTrackHorizontal={props => <div {...props} hidden />}
        >
          {certificates.map(item => (
            <div
              className={classNames('esign-cert__list-item', {
                'esign-cert__list-item_selected': item.id === selected
              })}
              key={item.id}
              onClick={() => this.handleSelectCertificate(item.id)}
            >
              {item.name}
            </div>
          ))}
        </Scrollbars>
      </div>
    );
  }

  renderInfo() {
    const { selected } = this.state;

    if (!selected) {
      return null;
    }

    const { certificates } = this.props;
    const certificate = certificates.find(item => item.id === selected);

    return (
      <div className="esign-cert__info">
        <div className="esign-cert__info-title">{t(Labels.MODAL_CERTIFICATE_PROPERTIES)}</div>

        <div className="esign-cert__info-list">
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t(Labels.MODAL_SUBJECT)}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'subject', t(Labels.NO_DATA))}</div>
          </div>
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t(Labels.MODAL_ISSUER)}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'issuer', t(Labels.NO_DATA))}</div>
          </div>
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t(Labels.MODAL_DATE_FROM)}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'dateFrom', t(Labels.NO_DATA))}</div>
          </div>
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t(Labels.MODAL_DATE_TO)}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'dateTo', t(Labels.NO_DATA))}</div>
          </div>
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t(Labels.MODAL_PROVIDER)}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'provider', t(Labels.NO_DATA))}</div>
          </div>
        </div>
      </div>
    );
  }

  renderButtons() {
    return (
      <div className="esign-cert__btns">
        <Btn onClick={this.handleHideModal}>{t(Labels.CANCEL_BTN)}</Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleSignDocument}>
          {t(Labels.SIGN_BTN)}
        </Btn>
      </div>
    );
  }

  render() {
    const { isOpen, isLoading, title } = this.props;

    return (
      <EcosModal
        className="esign-cert ecos-modal_width-sm"
        title={title}
        isOpen={isOpen}
        isLoading={isLoading}
        hideModal={this.handleHideModal}
      >
        {this.renderList()}
        {this.renderInfo()}
        {this.renderButtons()}
      </EcosModal>
    );
  }
}

export default EsignModal;
