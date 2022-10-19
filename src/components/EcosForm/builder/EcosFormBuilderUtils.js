import EcosFormBuilder from './EcosFormBuilderModal';
import EcosFormLocaleEditor from '../locale/FormLocaleEditorModal';
import Records from '../../Records/Records';
import React from 'react';
import ReactDOM from 'react-dom';

let formPanelIdx = 0;
const builders = {};

export class EcosFormBuilderUtils {
  static showBuilderForRecord(formRecord) {
    const record = Records.get(formRecord);

    const processFormDefinition = function(loadedFormDefinition) {
      const onSubmit = formDefinition => record.att('definition?json', formDefinition);

      const formId = record.getBaseRecord().id;
      const definition = {
        ...loadedFormDefinition,
        formId: formId.substring(formId.indexOf('@') + 1)
      };

      EcosFormBuilderUtils.__showEditorComponent('formBuilder', EcosFormBuilder, definition, onSubmit);
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

  static __showEditorComponent(componentKey, component, showData, onSubmit) {
    if (builders[componentKey]) {
      builders[componentKey].show(showData, onSubmit);
    } else {
      let container = document.createElement('div');

      const reactProps = {};

      container.id = 'EcosFormBuilderUtils-' + componentKey + '-' + formPanelIdx++;

      if (showData.formId) {
        reactProps.formId = showData.formId;
      }

      document.body.appendChild(container);

      const componentInstance = React.createElement(component, reactProps);
      const editor = ReactDOM.render(componentInstance, container);

      builders[componentKey] = editor;
      editor.show(showData, onSubmit);
    }
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.EcosFormBuilderUtils = EcosFormBuilderUtils;
