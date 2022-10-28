import React from 'react';
import ReactDOM from 'react-dom';

import EcosFormBuilder from './EcosFormBuilderModal';
import EcosFormLocaleEditor from '../locale/FormLocaleEditorModal';
import Records from '../../Records/Records';
import Formio from '../../../forms/Formio';

let formPanelIdx = 0;
const builders = {};

export class EcosFormBuilderUtils {
  /**
   *
   * @param formRecord {String}
   * @param form {Webform} - form instance
   */
  static showBuilderForRecord(formRecord, form) {
    const record = Records.get(formRecord);

    const processFormDefinition = function(loadedFormDefinition) {
      const onSubmit = formDefinition => record.att('definition?json', formDefinition);
      const options = {};

      const formId = record.getBaseRecord().id;
      const definition = {
        ...loadedFormDefinition,
        formId: formId.substring(formId.indexOf('@') + 1)
      };

      if (form) {
        options.parentId = form.id;
        Formio.forms[form.id] = form;
      }

      EcosFormBuilderUtils.__showEditorComponent('formBuilder', EcosFormBuilder, definition, onSubmit, options);
    };

    const defAtts = {
      definition: 'definition?json'
    };

    Records.get(formRecord)
      .load(defAtts)
      .then(data => {
        if (!data.definition) {
          Records.get('eform@DEFAULT')
            .load(defAtts)
            .then(data => {
              processFormDefinition(data.definition);
            });
        } else {
          processFormDefinition(data.definition);
        }
      });
  }

  static showLocaleEditorForRecord(formRecord) {
    let record = Records.get(formRecord);

    record.load('i18n?json').then(i18n => {
      let onSubmit = i18n => record.att('i18n?json', i18n);
      EcosFormBuilderUtils.__showEditorComponent('localeEditor', EcosFormLocaleEditor, i18n, onSubmit);
    });
  }

  /**
   *
   * @param componentKey {String}
   * @param component {ReactElement} - react-component for render
   * @param showData {Object} - form definition data
   * @param onSubmit {Function}
   * @param options {FormOptions} - advanced options for form (such as parentId)
   * @private
   */
  static __showEditorComponent(componentKey, component, showData, onSubmit, options) {
    if (builders[componentKey]) {
      builders[componentKey].show(showData, onSubmit);
    } else {
      let container = document.createElement('div');

      const reactProps = {};

      container.id = 'EcosFormBuilderUtils-' + componentKey + '-' + formPanelIdx++;

      if (showData && showData.formId) {
        reactProps.formId = showData.formId;
      }

      document.body.appendChild(container);

      const componentInstance = React.createElement(component, reactProps);
      const editor = ReactDOM.render(componentInstance, container);

      builders[componentKey] = editor;
      editor.show(showData, onSubmit, options);
    }
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.EcosFormBuilderUtils = EcosFormBuilderUtils;
