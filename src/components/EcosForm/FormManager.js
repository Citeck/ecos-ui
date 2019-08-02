import { goToCreateRecordPage } from '../../helpers/urls';
import React from 'react';
import ReactDOM from 'react-dom';
import EcosFormUtils from './EcosFormUtils';
import EcosFormModal from './EcosFormModal';

export default class FormManager {
  static createRecordByVariant(variant, options = {}) {
    if (!variant) {
      console.error("Create variant is undefined. Record creation can't be preformed");
      return;
    }

    let recordRef = variant.recordRef || (variant.type ? 'dict@' + variant.type : '');

    let isNewFormShouldBeUsed = variant.formKey || !variant.type;
    let isNewFormCanBeUsed = isNewFormShouldBeUsed || !!recordRef;

    if (isNewFormCanBeUsed && !isNewFormShouldBeUsed) {
      if (recordRef) {
        if (localStorage.forceEnableNewForms === 'true') {
          isNewFormShouldBeUsed = Promise.resolve(true);
        } else {
          isNewFormShouldBeUsed = EcosFormUtils.isNewFormsEnabled();
        }
        isNewFormShouldBeUsed = isNewFormShouldBeUsed
          .then(value => {
            return value ? EcosFormUtils.hasForm(recordRef, variant.formKey) : false;
          })
          .catch(e => {
            console.error(e);
            return false;
          });
      } else {
        isNewFormShouldBeUsed = Promise.resolve(false);
      }
    } else {
      isNewFormShouldBeUsed = Promise.resolve(true);
    }

    isNewFormShouldBeUsed
      .then(value => {
        if (value) {
          let attributes = variant.attributes || {};

          if (variant.destination) {
            attributes['_parent'] = variant.destination;
          }

          this.openFormModal({
            record: recordRef,
            formKey: variant.formKey,
            attributes: attributes,
            ...options
          });
        } else {
          goToCreateRecordPage(variant);
        }
      })
      .catch(e => {
        console.error(e);
        goToCreateRecordPage(variant);
      });
  }

  static openFormModal(props) {
    let form = React.createElement(EcosFormModal, props);

    let container = document.createElement('div');
    document.body.appendChild(container);

    ReactDOM.render(form, container);
  }
}
