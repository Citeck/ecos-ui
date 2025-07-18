import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { ErrorTypes, Labels, PLUGIN_URL } from '../../constants/esign';
import { getMLValue, t } from '../../helpers/util';
import { Esign } from '../../services/esign';
import DialogManager from '../common/dialogs/Manager';

import EsignModal from './EsignModal';

import './style.scss';

class EsignComponent extends Component {
  static propTypes = {
    recordRefs: PropTypes.arrayOf(PropTypes.string).isRequired,
    thumbprints: PropTypes.arrayOf(PropTypes.string),
    /**
     * callback function upon successful signing of a document
     */
    onSigned: PropTypes.func,
    onClose: PropTypes.func,
    /**
     * callback function to call before signing
     */
    onBeforeSigning: PropTypes.func
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
    isFetchingApi: true,
    selectedCertificate: null,
    signatures: []
  };

  constructor(props) {
    super(props);

    this.state.isOpen = true;

    Esign.init(props.recordRefs).then(this.serviceInitialized).catch(this.setError);
  }

  get hasErrors() {
    const { errorType, messageTitle, messageDescription } = this.state;

    return Boolean(errorType || messageTitle || messageDescription);
  }

  setError = ({ messageTitle, messageDescription, errorType, formattedError }) => {
    let descriptionClassNames = '';
    let modalClass = '';
    let buttons;

    switch (errorType) {
      case ErrorTypes.NO_CADESPLUGIN:
        buttons = [
          {
            label: Labels.CANCEL_BTN,
            onClick: this.handleCloseModal,
            isCloseAfterClick: true
          },
          {
            label: Labels.GO_TO_PLUGIN_PAGE_BTN,
            className: 'ecos-btn_blue ecos-btn_hover_light-blue esign-message__btn-full',
            onClick: this.handleGoToPlugin
          }
        ];
        descriptionClassNames = 'esign-message__description';
        break;
      case ErrorTypes.HANDLE:
        modalClass = 'esign__with-one-actions';
        buttons = [
          {
            label: Labels.CANCEL_BTN,
            onClick: this.handleCloseModal,
            className: 'esign-message__btn-full',
            isCloseAfterClick: true
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
      modalClass,
      descriptionClassNames
    });
  };

  getCertificates(thumbprints) {
    Esign.getCertificates(thumbprints).then(this.signDefault).then(this.setCertificates).catch(this.setError);
  }

  signDefault = certificates => {
    if (Array.isArray(certificates) && certificates.length === 1) {
      this.handleSignDocument(certificates[0]);
    }
    return certificates;
  };

  setCertificates = certificates => {
    this.setState({ certificates });
  };

  setSignatures = signatures => {
    this.setState({ signatures });
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

  handleSignDocument = async selectedCertificate => {
    const { onBeforeSigning, recordRefs } = this.props;

    this.setState({ isLoading: true, selectedCertificate });

    if (isFunction(onBeforeSigning)) {
      try {
        await onBeforeSigning(recordRefs, selectedCertificate);
        Esign.signDocument(this.props.recordRefs, selectedCertificate, this.setSignatures).then(this.documentSigned).catch(this.setError);
      } catch (e) {
        console.error('[EsignComponent] Error in handleSignDocument:', e);
        this.setError({ messageTitle: t(Labels.ERROR), messageDescription: getMLValue(e), errorType: ErrorTypes.HANDLE });
      }
    } else {
      Esign.signDocument(this.props.recordRefs, selectedCertificate, this.setSignatures).then(this.documentSigned).catch(this.setError);
    }
  };

  documentSigned = documentSigned => {
    const { onSigned, onClose } = this.props;
    const { signatures, selectedCertificate } = this.state;

    let certificate;

    if (selectedCertificate) {
      certificate = {
        subject: selectedCertificate.friendlySubjectInfo
      };
    }

    this.setState({ documentSigned });

    const successFalseArray = (documentSigned || []).filter(documentElement => documentElement.success === false);

    if (documentSigned && successFalseArray.length === 0 && isFunction(onSigned)) {
      onSigned(signatures, certificate, documentSigned);
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
      </>
    );
  }
}

export default EsignComponent;
