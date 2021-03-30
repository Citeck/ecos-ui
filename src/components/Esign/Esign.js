import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { Esign } from '../../services/esign';
import { Btn } from '../common/btns';
import EsignModal from './EsignModal';
import MessageModal from './MessageModal';
import { t } from '../../helpers/util';
import { ErrorTypes, Labels, PLUGIN_URL } from '../../constants/esign';

import './style.scss';

class EsignComponent extends Component {
  static propTypes = {
    recordRefs: PropTypes.arrayOf(PropTypes.string).isRequired,
    thumbprints: PropTypes.arrayOf(PropTypes.string),
    /**
     * callback function upon successful signing of a document
     */
    onSigned: PropTypes.func,
    onClose: PropTypes.func
  };

  static defaultProps = {
    onClose: () => {}
  };

  state = {
    isOpen: false,
    documentSigned: false,
    isLoading: true,
    documentBase64: '',
    messageTitle: '',
    messageDescription: '',
    errorType: '',
    cadespluginApi: null,
    certificates: [],
    isFetchingApi: true
  };

  constructor(props) {
    super(props);

    this.state.isOpen = true;

    Esign.init(props.recordRefs)
      .then(this.serviceInitialized)
      .catch(this.setError);
  }

  get hasErrors() {
    const { errorType, messageTitle, messageDescription } = this.state;

    return Boolean(errorType || messageTitle || messageDescription);
  }

  setError = ({ messageTitle, messageDescription, errorType }) => {
    this.setState({
      isOpen: true,
      messageTitle,
      messageDescription,
      errorType
    });
  };

  getCertificates(thumbprints) {
    Esign.getCertificates(thumbprints)
      .then(this.signDefault)
      .then(this.setCertificates)
      .catch(this.setError);
  }

  signDefault = certificates => {
    if (Array.isArray(certificates) && certificates.length === 1) {
      this.handleSignDocument(certificates[0].id);
    }
    return certificates;
  };

  setCertificates = certificates => {
    this.setState({ certificates });
  };

  serviceInitialized = cadespluginApi => {
    this.getCertificates(this.props.thumbprints);
    this.setState({
      isFetchingApi: false,
      isLoading: false,
      cadespluginApi
    });
  };

  handleCloseModal = () => {
    this.setState({ isOpen: false }, this.props.onClose);
  };

  handleGoToPlugin = () => {
    window.open(PLUGIN_URL, '_blank');
  };

  handleSignDocument = selectedCertificate => {
    this.setState({ isLoading: true });

    Esign.signDocument(this.props.recordRefs, selectedCertificate)
      .then(this.documentSigned)
      .catch(this.setError);
  };

  documentSigned = documentSigned => {
    const { onSigned, onClose } = this.props;

    this.setState({ documentSigned });

    if (documentSigned && typeof onSigned === 'function') {
      onSigned();
    }

    onClose();
  };

  renderInfoMessage() {
    const { messageTitle, messageDescription, errorType, isOpen } = this.state;
    let buttons = null;

    switch (errorType) {
      case ErrorTypes.NO_CADESPLUGIN:
        buttons = (
          <>
            <Btn onClick={this.handleCloseModal}>{t(Labels.CANCEL_BTN)}</Btn>
            <Btn className="ecos-btn_blue ecos-btn_hover_light-blue esign-message__btn-full" onClick={this.handleGoToPlugin}>
              {t(Labels.GO_TO_PLUGIN_PAGE_BTN)}
            </Btn>
          </>
        );
        break;
      default:
        buttons = (
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleCloseModal}>
            {t(Labels.OK_BTN)}
          </Btn>
        );
        break;
    }

    return (
      <MessageModal
        isOpen={Boolean(isOpen && (messageTitle || messageDescription))}
        title={messageTitle}
        description={messageDescription}
        onHideModal={this.handleCloseModal}
      >
        <div className="esign-message__btns">{buttons}</div>
      </MessageModal>
    );
  }

  renderViewElement() {
    const { viewElement: ViewElement, toggleSignModal } = this.props;

    if (!ViewElement) {
      return null;
    }

    return <ViewElement onClick={() => toggleSignModal()} />;
  }

  render() {
    const { isOpen, isLoading, certificates, cadespluginApi, documentSigned } = this.state;

    if (documentSigned) {
      return null;
    }

    return (
      <>
        {this.renderViewElement()}

        <EsignModal
          isOpen={Boolean(isOpen && cadespluginApi && !this.hasErrors && !(Array.isArray(certificates) && certificates.length === 1))}
          isLoading={isLoading}
          title={t(Labels.MODAL_TITLE)}
          onHideModal={this.handleCloseModal}
          onSign={this.handleSignDocument}
          certificates={certificates}
          selected={get(certificates, '0.id', '')}
        />

        {this.renderInfoMessage()}
      </>
    );
  }
}

export default EsignComponent;
