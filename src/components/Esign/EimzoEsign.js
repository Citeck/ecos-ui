import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { Esign } from '../../services/esign';
import EsignModal from './EsignModal';
import { t } from '../../helpers/util';
import { ErrorTypes, Labels } from '../../constants/esign';
import DialogManager from '../common/dialogs/Manager';

import './style.scss';

class EimzoEsignComponent extends Component {
  static propTypes = {
    recordRefs: PropTypes.arrayOf(PropTypes.string).isRequired,
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
    eimzoApi: null,
    certificates: [],
    isFetchingApi: true,
    selectedCertificate: null,
    signatures: []
  };

  constructor(props) {
    super(props);

    this.state.isOpen = true;

    Esign.initEimzo(props.recordRefs)
      .then(this.serviceInitialized)
      .catch(this.setError);
  }

  get hasErrors() {
    const { errorType, messageTitle, messageDescription } = this.state;

    return Boolean(errorType || messageTitle || messageDescription);
  }

  setError = ({ messageTitle, messageDescription, errorType, formattedError }) => {
    let descriptionClassNames = '';
    let buttons = [];

    switch (errorType) {
      case ErrorTypes.NO_EIMZO:
        buttons = [
          {
            label: Labels.CANCEL_BTN,
            onClick: this.handleCloseModal
          }
        ];
        descriptionClassNames = 'esign-message__description';
        break;
      default:
        buttons = [];
        break;
    }

    this.setState({
      isOpen: true,
      messageTitle,
      messageDescription,
      errorType
    });

    return DialogManager.showErrorDialog({
      title: messageTitle,
      text: messageDescription,
      error: formattedError,
      buttons,
      descriptionClassNames
    });
  };

  getCertificates() {
    Esign.getEimzoCertificates()
      .then(this.setCertificates)
      .catch(this.setError);
  }

  setCertificates = certificates => {
    this.setState({ certificates });
  };

  setSignatures = signatures => {
    this.setState({ signatures });
  };

  serviceInitialized = eimzoApi => {
    this.getCertificates();
    this.setState({
      isFetchingApi: false,
      isLoading: false,
      eimzoApi
    });
  };

  handleCloseModal = () => {
    this.setState({ isOpen: false }, this.props.onClose);
  };

  handleSignDocument = selectedCertificate => {
    this.setState({ isLoading: true, selectedCertificate });

    Esign.signDocumentEimzo(this.props.recordRefs, selectedCertificate, this.setSignatures)
      .then(this.documentSigned)
      .catch(this.setError);
  };

  documentSigned = documentSigned => {
    const { onSigned, onClose } = this.props;
    const { signatures, selectedCertificate } = this.state;

    let certificate;

    if (selectedCertificate) {
      certificate = {
        subject: selectedCertificate.alias
      };
    }

    this.setState({ documentSigned });

    if (documentSigned && typeof onSigned === 'function') {
      onSigned(signatures, certificate);
    }

    onClose();
  };

  renderViewElement() {
    const { viewElement: ViewElement, toggleSignModal } = this.props;

    if (!ViewElement) {
      return null;
    }

    return <ViewElement onClick={() => toggleSignModal()} />;
  }

  render() {
    const { isOpen, isLoading, certificates, eimzoApi, documentSigned } = this.state;

    if (documentSigned) {
      return null;
    }

    return (
      <>
        {this.renderViewElement()}

        <EsignModal
          isOpen={Boolean(isOpen && eimzoApi && !this.hasErrors)}
          isLoading={isLoading}
          title={t(Labels.MODAL_TITLE)}
          onHideModal={this.handleCloseModal}
          onSign={this.handleSignDocument}
          certificates={certificates}
          selected={get(certificates, '0.id', '')}
        />
      </>
    );
  }
}

export default EimzoEsignComponent;
