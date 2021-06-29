import React from 'react';
import ReactDOM from 'react-dom';

import Modal from '../common/EcosModal/CiteckEcosModal';
import EcosFormUtils from './EcosFormUtils';
import EcosFormModal from './EcosFormModal';
import EcosForm from './EcosForm';

class FormManager {
  static createRecordByVariant = (variant, options = {}) => {
    if (!variant) {
      console.error("[FormManager createRecordByVariant] Create variant is undefined. Record creation can't be preformed");
      return;
    }

    let { recordRef: record = '', type, sourceId, formId, formRef, formKey, attributes = {}, destination, formOptions = {} } = variant;

    formId = formRef || formId;

    if (!record && sourceId) {
      record = `${variant.sourceId}@`;
    }

    if (!record && type) {
      record = `dict@${variant.type}`;
    }

    if (destination && !attributes._parent) {
      attributes._parent = destination;
    }

    const props = {
      record,
      formKey,
      attributes,
      options: {
        ...formOptions
      },
      ...options
    };

    if (variant.typeRef) {
      props.options.typeRef = variant.typeRef;
    }

    if (EcosFormUtils.isFormId(formId)) {
      props.formId = formId;
    }

    this.openFormModal(props);
  };

  static openFormModal(props) {
    const container = document.createElement('div');
    const handleUnmount = () => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
    };

    const form = React.createElement(EcosFormModal, {
      ...props,
      isModalOpen: true,
      onHideModal: () => {
        handleUnmount();

        if (props.onHideModal) {
          props.onHideModal();
        }
      },
      onCancelModal: () => {
        handleUnmount();

        if (typeof props.onModalCancel === 'function') {
          props.onModalCancel();
        }
      }
    });

    document.body.appendChild(container);
    ReactDOM.render(form, container);

    return container;
  }

  static openFormControlledModal(params) {
    const { title, onSubmit, onFormCancel, ...props } = params;
    const modal = new Modal();

    const _onSubmit = record => {
      modal.close();
      onSubmit && onSubmit(record);
    };

    const _onFormCancel = () => {
      modal.close();
      onFormCancel && onFormCancel();
    };

    modal.open(<EcosForm initiator={{ type: 'modal' }} {...props} onSubmit={_onSubmit} onFormCancel={_onFormCancel} />, { title });

    return modal;
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.FormManager = FormManager;

// Cause: https://citeck.atlassian.net/browse/ECOSCOM-3028
window.Citeck.forms = window.Citeck.forms || {};
window.Citeck.forms.eform =
  window.Citeck.forms.eform ||
  function(record, config = {}) {
    const { params = {}, ...other } = config;
    FormManager.openFormModal({ record, ...params, ...other });
  };

export default FormManager;
