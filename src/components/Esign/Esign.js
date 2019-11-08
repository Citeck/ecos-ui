import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { Btn } from '../common/btns';
import { selectStateByKey, selectGeneralState } from '../../selectors/esign';
import { init, getCertificates, selectCertificate, signDocument } from '../../actions/esign';
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
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);

    this.state = {
      isOpenModal: false
    };

    /**
     * Отключаем стандартные уведомления от плагина
     */
    window.cadesplugin_skip_extension_install = true;

    props.init();
  }

  static getDerivedStateFromProps(props, state) {
    const newState = {};

    if (props.documentSigned && state.isOpenModal) {
      const id = get(props.certificates, '0.id', '');

      newState.isOpenModal = false;
      props.selectCertificate(id);
    }

    if (!Object.keys(newState).length) {
      return null;
    }

    return newState;
  }

  get hasErrors() {
    const { errorType, messageTitle, messageDescription } = this.props;

    return Boolean(errorType || messageTitle || messageDescription);
  }

  handleClickSign = () => {
    this.setState({ isOpenModal: true });
  };

  handleCloseModal = () => {
    const { certificates, selectCertificate } = this.props;
    const id = get(certificates, '0.id', '');

    this.setState({ isOpenModal: false });
    selectCertificate(id);
  };

  handleGoToPlugin = () => {
    window.open('https://www.cryptopro.ru/products/cades/plugin', '_blank');
  };

  handleSelectCertificate = id => {
    this.props.selectCertificate(id);
  };

  handleSignDocument = () => {
    const { signDocument, selectedCertificate } = this.props;

    signDocument(selectedCertificate);
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
    const { isLoading, isFetchingApi, certificates, cadespluginApi, selectedCertificate, documentSigned } = this.props;
    const { isOpenModal } = this.state;

    if (documentSigned) {
      return null;
    }

    return (
      <>
        <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleClickSign} disabled={isLoading || isFetchingApi}>
          Подписать
        </Btn>

        <EsignModal
          isOpen={Boolean(isOpenModal && cadespluginApi && !this.hasErrors)}
          isLoading={isLoading}
          title={t(LABELS.MODAL_TITLE)}
          onHideModal={this.handleCloseModal}
          onSelectCertificate={this.handleSelectCertificate}
          onSign={this.handleSignDocument}
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
  getCertificates: () => dispatch(getCertificates(ownProps.nodeRef)),
  selectCertificate: certificate => dispatch(selectCertificate({ id: ownProps.nodeRef, certificate })),
  signDocument: certificateId => dispatch(signDocument({ id: ownProps.nodeRef, certificateId }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Esign);
