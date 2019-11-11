import React, { Component } from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';

import { Btn } from '../common/btns';
import EcosModal from '../common/EcosModal';
import { t } from '../../helpers/util';

class EsignModal extends Component {
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
    this.props.onSign(this.state.selected);
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
        <div className="esign-cert__info-title">Свойства сертификата</div>

        <div className="esign-cert__info-list">
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t('Subject')}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'subject', 'нет даных')}</div>
          </div>
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t('Issuer')}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'issuer', 'нет даных')}</div>
          </div>
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t('From')}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'dateFrom', 'нет даных')}</div>
          </div>
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t('To')}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'dateTo', 'нет даных')}</div>
          </div>
          <div className="esign-cert__info-list-item">
            <div className="esign-cert__info-list-item-label">{t('Provider')}</div>
            <div className="esign-cert__info-list-item-value">{get(certificate, 'provider', 'нет даных')}</div>
          </div>
        </div>
      </div>
    );
  }

  renderButtons() {
    return (
      <div className="esign-cert__btns">
        <Btn onClick={this.handleHideModal}>Отмена</Btn>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleSignDocument}>
          Подписать
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
