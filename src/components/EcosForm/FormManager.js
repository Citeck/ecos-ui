import { goToCreateRecordPage } from '../../helpers/urls';
import React from 'react';
import ReactDOM from 'react-dom';
import EcosFormUtils from './EcosFormUtils';
import EcosFormModal from './EcosFormModal';
import { checkFunctionalAvailabilityForUser } from '../../helpers/export/userInGroupsHelper';

class FormManager {
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

        const shouldDisplayNewFormsForUser = checkFunctionalAvailabilityForUser('default-ui-new-forms-access-groups');
        isNewFormShouldBeUsed = Promise.all([isNewFormShouldBeUsed, shouldDisplayNewFormsForUser])
          .then(function(values) {
            if (values.includes(true)) {
              return EcosFormUtils.hasForm(recordRef, variant.formKey);
            }
            return false;
          })
          .catch(function(e) {
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

          const props = {
            record: recordRef,
            formKey: variant.formKey,
            attributes,
            options: {
              params: this.parseCreateArguments(variant.createArguments)
            },
            ...options
          };

          if (EcosFormUtils.isFormId(variant.formId)) {
            props.formId = variant.formId;
          }

          this.openFormModal(props);
        } else {
          goToCreateRecordPage(variant);
        }
      })
      .catch(e => {
        console.error(e);
        goToCreateRecordPage(variant);
      });
  }

  static parseCreateArguments(createArgs) {
    if (!createArgs) {
      return {};
    }
    let params = {};
    try {
      let args = createArgs.split('&');
      for (let i = 0; i < args.length; i++) {
        let keyValue = (args[i] || '').split('=');
        if (keyValue.length === 2) {
          let key = keyValue[0] || '';
          let value = keyValue[1] || '';
          if (key.indexOf('param_') === 0) {
            params[key.substring('param_'.length)] = value;
          }
        }
      }
    } catch (e) {
      //protection for hotfix
      //todo: remove it in develop
      console.error(e);
    }
    return params;
  }

  static openFormModal(props) {
    let form = React.createElement(EcosFormModal, { ...props, isModalOpen: true });

    let container = document.createElement('div');
    document.body.appendChild(container);

    ReactDOM.render(form, container);
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.FormManager = FormManager;

// Cause: https://citeck.atlassian.net/browse/ECOSCOM-3028
window.Citeck.forms = window.Citeck.forms || {};
window.Citeck.forms.eform =
  window.Citeck.forms.eform ||
  function(record, config) {
    const { params = {}, ...other } = config;
    FormManager.openFormModal({ record, ...params, ...other });
  };

export default FormManager;
