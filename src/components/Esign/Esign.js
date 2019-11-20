import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { Btn } from '../common/btns';
import { selectStateByKey, selectGeneralState } from '../../selectors/esign';
import { init, getCertificates, signDocument, clearMessage, toggleSignModal } from '../../actions/esign';
import EsignModal from './EsignModal';
import MessageModal from './MessageModal';
import { getSearchParams, t } from '../../helpers/util';
import { ErrorTypes, Labels, PLUGIN_URL, TOGGLE_SIGN_MODAL_EVENT } from '../../constants/esign';

import './style.scss';

const customEvent = document.createEvent('Event');

customEvent.initEvent(TOGGLE_SIGN_MODAL_EVENT, true, true);

export const openSignModal = nodeRef => {
  customEvent.customParams = { nodeRef };

  document.dispatchEvent(customEvent);
};

class Esign extends Component {
  static propTypes = {
    getDocumentsUrl: PropTypes.string.isRequired,
    nodeRef: PropTypes.string,
    viewElement: PropTypes.oneOfType([PropTypes.node, PropTypes.element, PropTypes.func]),
    isOpen: PropTypes.bool,
    singleton: PropTypes.bool,
    documentSigned: PropTypes.bool,
    isLoading: PropTypes.bool,
    documentBase64: PropTypes.string,
    messageTitle: PropTypes.string,
    messageDescription: PropTypes.string,
    errorType: PropTypes.string,
    cadespluginApi: PropTypes.object,
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
    isFetchingApi: PropTypes.bool,
    /**
     * колбек-функция при успешном подписании документа
     */
    onSigned: PropTypes.func
  };

  static defaultProps = {
    nodeRef: get(getSearchParams(), 'nodeRef', '')
  };

  constructor(props) {
    super(props);

    /**
     * Отключаем стандартные уведомления от плагина
     */
    window.cadesplugin_skip_extension_install = true;
    props.init();
  }

  componentDidMount() {
    document.addEventListener(TOGGLE_SIGN_MODAL_EVENT, this.handleToggleSignModal, false);
  }

  componentDidUpdate(prevProps) {
    const { documentSigned, onSigned } = this.props;

    if (prevProps.documentSigned && !documentSigned) {
      if (typeof onSigned === 'function') {
        onSigned();
      }
    }
  }

  get hasErrors() {
    const { errorType, messageTitle, messageDescription } = this.props;

    return Boolean(errorType || messageTitle || messageDescription);
  }

  handleToggleSignModal = event => {
    const { nodeRef, singleton, toggleSignModal, getDocumentsUrl } = this.props;
    const ref = get(event, 'customParams.nodeRef', '');

    if (singleton || ref === nodeRef) {
      toggleSignModal(getDocumentsUrl);
    }
  };

  handleCloseModal = () => {
    const { clearMessage, toggleSignModal, getDocumentsUrl } = this.props;

    clearMessage();
    toggleSignModal(getDocumentsUrl);
  };

  handleGoToPlugin = () => {
    window.open(PLUGIN_URL, '_blank');
  };

  handleSignDocument = selectedCertificate => {
    const { signDocument, getDocumentsUrl } = this.props;

    signDocument(selectedCertificate, getDocumentsUrl);
  };

  renderInfoMessage() {
    const { messageTitle, messageDescription, errorType, isOpen } = this.props;
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
    const { viewElement: ViewElement, toggleSignModal, getDocumentsUrl } = this.props;

    if (!ViewElement) {
      return null;
    }

    return <ViewElement onClick={() => toggleSignModal(getDocumentsUrl)} />;
  }

  render() {
    const { isOpen, isLoading, certificates, cadespluginApi, documentSigned } = this.props;

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

        {this.renderInfoMessage()}
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const id = get(ownProps, 'nodeRef', get(getSearchParams(), 'nodeRef', ''));

  return {
    ...selectGeneralState(state),
    ...selectStateByKey(state, id)
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const id = get(ownProps, 'nodeRef', get(getSearchParams(), 'nodeRef', ''));

  return {
    init: () => dispatch(init(id)),
    toggleSignModal: url => dispatch(toggleSignModal({ id, url })),
    clearMessage: () => dispatch(clearMessage(id)),
    getCertificates: () => dispatch(getCertificates(id)),
    signDocument: (certificateId, url) => dispatch(signDocument({ id, certificateId, url }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Esign);
