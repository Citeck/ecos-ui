import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash/debounce';

import Modal from '../common/EcosModal/CiteckEcosModal';
import EcosFormUtils from './EcosFormUtils';
import EcosFormModal from './EcosFormModal';
import EcosForm from './EcosForm';

class FormManager {
  static createRecordByVariant = debounce(
    (variant, options = {}) => {
      if (!variant) {
        console.error("Create variant is undefined. Record creation can't be preformed");
        return;
      }

      let recordRef = variant.recordRef || (variant.type ? 'dict@' + variant.type : '');
      let attributes = variant.attributes || {};

      if (variant.destination && !attributes['_parent']) {
        attributes['_parent'] = variant.destination;
      }

      const props = {
        record: recordRef,
        formKey: variant.formKey,
        attributes,
        options: {},
        ...options
      };

      if (variant.typeRef) {
        props.options.typeRef = variant.typeRef;
      }

      if (EcosFormUtils.isFormId(variant.formId)) {
        props.formId = variant.formId;
      }

      this.openFormModal(props);
    },
    3000,
    {
      leading: true,
      trailing: false
    }
  );

  static openFormModal(props) {
    const container = document.createElement('div');

    const form = React.createElement(EcosFormModal, {
      ...props,
      isModalOpen: true,
      onHideModal: () => {
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
        if (props.onHideModal) {
          props.onHideModal();
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
