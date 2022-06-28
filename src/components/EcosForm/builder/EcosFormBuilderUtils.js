import EcosFormBuilder from './EcosFormBuilderModal';
import EcosFormLocaleEditor from '../locale/FormLocaleEditorModal';
import Records from '../../Records/Records';
import React from 'react';
import ReactDOM from 'react-dom';

let formPanelIdx = 0;
const builders = {};

export class EcosFormBuilderUtils {
  static showBuilderForRecord(formRecord) {
    let record = Records.get(formRecord);

    let processFormDefinition = function(loadedFormDefinition) {
      let onSubmit = formDefinition => record.att('definition?json', formDefinition);
      EcosFormBuilderUtils.__showEditorComponent('formBuilder', EcosFormBuilder, loadedFormDefinition, onSubmit);
    };

    let defAtts = {
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
      container.id = 'EcosFormBuilderUtils-' + componentKey + '-' + formPanelIdx++;
      document.body.appendChild(container);

      const componentInstance = React.createElement(component);
      const editor = ReactDOM.render(componentInstance, container);
      builders[componentKey] = editor;
      editor.show(showData, onSubmit);
    }
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.EcosFormBuilderUtils = EcosFormBuilderUtils;
