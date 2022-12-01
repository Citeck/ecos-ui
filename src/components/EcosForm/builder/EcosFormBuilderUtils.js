import React from 'react';
import ReactDOM from 'react-dom';

import EcosFormBuilder from './EcosFormBuilderModal';
import EcosFormLocaleEditor from '../locale/FormLocaleEditorModal';
import Records from '../../Records/Records';

let formPanelIdx = 0;
const builders = {};

export class EcosFormBuilderUtils {
  /**
   *
   * @param formRecord {String|Object}
   * @param forceSubmit {Boolean}
   */
  static showBuilderForRecord(formRecord, forceSubmit = false) {
    const record = Records.get(formRecord);

    const processFormDefinition = function(loadedFormDefinition) {
      const onSubmit = formDefinition => {
        record.att('definition?json', formDefinition);

        if (forceSubmit) {
          record.save();
        }
      };

      const options = {};

      const formId = record.getBaseRecord().id;
      const definition = {
        ...loadedFormDefinition,
        formId: formId.substring(formId.indexOf('@') + 1)
      };

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

  /**
   *
   * @param formRecord {String|Object}
   * @param forceSubmit {Boolean}
   */
  static showLocaleEditorForRecord(formRecord, forceSubmit = false) {
    const record = Records.get(formRecord);

    record.load('i18n?json').then(i18n => {
      const onSubmit = i18n => {
        record.att('i18n?json', i18n);

        if (forceSubmit) {
          record.save();
        }
      };

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
      builders[componentKey].show(showData, onSubmit, options);
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
