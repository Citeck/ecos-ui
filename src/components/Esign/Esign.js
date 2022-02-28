import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { Esign } from '../../services/esign';
import EsignModal from './EsignModal';
import { t } from '../../helpers/util';
import { ErrorTypes, Labels, PLUGIN_URL } from '../../constants/esign';

import './style.scss';
import DialogManager from '../common/dialogs/Manager';

class EsignComponent extends Component {
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

  setError = ({ messageTitle, messageDescription, errorType, formattedError }) => {
    let descriptionClassNames = '';
    let buttons = [];

    switch (errorType) {
      case ErrorTypes.NO_CADESPLUGIN:
        buttons = [
          {
            label: Labels.CANCEL_BTN,
            onClick: this.handleCloseModal
          },
          {
            label: Labels.GO_TO_PLUGIN_PAGE_BTN,
            className: 'ecos-btn_blue ecos-btn_hover_light-blue esign-message__btn-full',
            onClick: this.handleGoToPlugin
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
    Esign.getCertificates()
      .then(this.setCertificates)
      .catch(this.setError);
  }

  setCertificates = certificates => {
    this.setState({ certificates });
  };

  serviceInitialized = cadespluginApi => {
    this.getCertificates();
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
          isOpen={Boolean(isOpen && cadespluginApi && !this.hasErrors)}
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
