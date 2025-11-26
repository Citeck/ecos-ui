import isFunction from 'lodash/isFunction';
import React from 'react';
import { createRoot } from 'react-dom/client';

import Modal from '../common/EcosModal/CiteckEcosModal';

import EcosForm from './EcosForm';
import EcosFormModal from './EcosFormModal';
import EcosFormUtils from './EcosFormUtils';

import recordActions from '@/components/Records/actions';
import { getId } from '@/helpers/util';

class FormManager {
  #root = null;

  static createRecordByVariant = (variant, options = {}) => {
    if (!variant) {
      console.error("[FormManager createRecordByVariant] Create variant is undefined. Record creation can't be preformed");
      return;
    }

    let {
      recordRef: record = '',
      type,
      sourceId,
      formId,
      formRef,
      formKey,
      formMode,
      attributes = {},
      destination,
      formOptions = {}
    } = variant;

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
      formMode,
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

    const baseOnSubmit = props.onSubmit || (() => {});
    if (variant.postActionRef) {
      props.onSubmit = async record => {
        let actionProps = null;
        try {
          actionProps = await recordActions.getActionProps(variant.postActionRef);
          await recordActions.execForRecord(record, actionProps);
          return baseOnSubmit(record, true);
        } catch (error) {
          console.error(
            'Error occurred while post-create action execution. ActionRef: ' + variant.postActionRef + ' Record: ' + record.id,
            error
          );
          return baseOnSubmit(record, false);
        }
      };
    } else {
      props.onSubmit = record => {
        return baseOnSubmit(record, false);
      };
    }

    return this.openFormModal(props);
  };

  static openFormModal(props) {
    const container = document.createElement('div');
    container.id = getId();

    document.body.appendChild(container);
    const root = createRoot(container);

    const form = React.createElement(EcosFormModal, {
      ...props,
      container,
      isModalOpen: true,
      onHideModal: () => {
        root.unmount();
        this.destroyForm(container);
        isFunction(props.onHideModal) && props.onHideModal();
      },
      onCancelModal: () => {
        setTimeout(() => {
          root.unmount();
        }, 0);

        this.destroyForm(container);
        isFunction(props.onModalCancel) && props.onModalCancel();
      }
    });

    root.render(form);

    return container;
  }

  static destroyForm(container) {
    if (document.getElementById(container.id)) {
      document.body.removeChild(container);
    }
  }

  static openFormControlledModal(params) {
    const { title, onSubmit, onFormCancel, ...props } = params;
    const modal = new Modal();

    const _onSubmit = record => {
      modal.close();
      isFunction(onSubmit) && onSubmit(record);
    };

    const _onFormCancel = () => {
      modal.close();
      isFunction(onFormCancel) && onFormCancel();
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
  function (record, config = {}) {
    const { params = {}, ...other } = config;
    FormManager.openFormModal({ record, ...params, ...other });
  };

export default FormManager;
