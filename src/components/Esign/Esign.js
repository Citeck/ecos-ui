import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import getCadespluginAPI from 'async-cadesplugin';

import { Btn } from '../common/btns';
import { selectStateByKey, selectGeneralState } from '../../selectors/esign';
import { init, getCertificates } from '../../actions/esign';
import EsignModal from './EsignModal';
import MessageModal from './MessageModal';
import { t } from '../../helpers/util';

import './style.scss';
import { ErrorTypes } from '../../constants/esign';

const LABELS = {
  MODAL_TITLE: 'Выбор сертификата для подписи',
  MODAL_ALREADY_SIGNED_TITLE: 'Документ уже был подписан',
  MODAL_NO_CERTIFICATES_TITLE: 'Нет доступных сертификатов',
  MODAL_INSTALL_EXTENSION_TITLE: 'Установите расширение',
  MODAL_INSTALL_EXTENSION_DESCRIPTION: 'Чтобы продолжить, установите расширение КриптоПро для браузера с сайта cryptopro.ru'
};

class Esign extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpenModal: false
    };

    window.cadesplugin_skip_extension_install = true;

    this.props.init();
  }

  async sign() {
    const certificates = await this.state.api.getValidCertificates();

    console.warn('certificates => ', certificates);

    try {
      const base64DataToSign = btoa('Hello world');
      const api = await getCadespluginAPI();
      const certificate = await api.getFirstValidCertificate();
      const signature = await api.signBase64(certificate.thumbprint, base64DataToSign);

      console.log(await certificate.privateKey.ProviderName, await certificate.privateKey.ProviderType);
    } catch (error) {
      console.log(error.message);
    }
  }

  handleClickSign = () => {
    // this.props.getCertificates();
    this.setState({ isOpenModal: true });
    // documentSign('workspace://SpacesStore/e617a72f-02fa-4fcd-9ba3-685cd8b3f9f6')
  };

  getRefInfo() {
    // esignApi.getDocumentData(this.props.nodeRef).then(
    //   async function(result) {
    //     const base64 = get(result, 'data.0.base64');
    //     const certificate = await this.state.api.getFirstValidCertificate();
    //
    //     this.setState({ base64 });
    //     const signature = await this.state.api.signBase64(certificate.thumbprint, base64);
    //
    //     console.warn('signature => ', signature);
    //   }.bind(this)
    // );
  }

  handleCloseModal = () => {
    this.setState({ isOpenModal: false });
  };

  handleGoToPlugin = () => {
    window.open('https://www.cryptopro.ru/products/cades/plugin', '_blank');
  };

  renderInfoMessage() {
    const { messageTitle, messageDescription, errorType } = this.props;
    const { isOpenModal } = this.state;
    let buttons = null;

    switch (errorType) {
      case ErrorTypes.NO_CADESPLUGIN:
        buttons = (
          <>
            <Btn onClick={this.handleCloseModal}>Отмена</Btn>
            <Btn className="ecos-btn_blue ecos-btn_hover_light-blue esign-message__btn-full" onClick={this.handleGoToPlugin}>
              Перейти на страницу установки
            </Btn>
          </>
        );
        break;
      default:
        buttons = (
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleCloseModal}>
            OK
          </Btn>
        );
        break;
    }

    return (
      <MessageModal
        isOpen={Boolean(isOpenModal && (messageTitle || messageDescription))}
        title={messageTitle}
        description={messageDescription}
        onHideModal={this.handleCloseModal}
      >
        <div className="esign-message__btns">{buttons}</div>
      </MessageModal>
    );
  }

  render() {
    const { isLoading, certificates, cadespluginApi, selectedCertificate } = this.props;
    const { isOpenModal } = this.state;

    return (
      <>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleClickSign} disabled={isLoading}>
          Подписать
        </Btn>

        <EsignModal
          isOpen={Boolean(isOpenModal && cadespluginApi)}
          isLoading={isLoading}
          title={t(LABELS.MODAL_TITLE)}
          onHideModal={this.handleCloseModal}
          certificates={certificates}
          selected={selectedCertificate}
        />

        {this.renderInfoMessage()}
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  ...selectGeneralState(state),
  ...selectStateByKey(state, ownProps.nodeRef)
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  init: () => dispatch(init(ownProps.nodeRef)),
  getCertificates: () => dispatch(getCertificates(ownProps.nodeRef))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Esign);
