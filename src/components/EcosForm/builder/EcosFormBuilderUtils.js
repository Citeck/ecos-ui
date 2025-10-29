import React from 'react';
import ReactDOM from 'react-dom';

import { goToCardDetailsPage } from '../../../helpers/urls';
import { PRE_SETTINGS_TYPES, PreSettings } from '../../PreSettings';
import Records from '../../Records/Records';
import { PERMISSION_WRITE_ATTR } from '../../Records/constants';
import EcosFormLocaleEditor from '../locale/FormLocaleEditorModal';

import EcosFormBuilder from './EcosFormBuilderModal';

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

    const processPreSettings = loadedFormDefinition => {
      const preSettings = new PreSettings();
      const config = {
        presettingsType: PRE_SETTINGS_TYPES.FORM,
        definition: loadedFormDefinition
      };

      const formId = record.getBaseRecord().id;

      const callback = nodeRef => {
        goToCardDetailsPage(nodeRef);
      };

      preSettings.open(formId, config, callback);
    };

    const processFormDefinition = loadedFormDefinition => {
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
      definition: 'definition?json',
      canWrite: PERMISSION_WRITE_ATTR
    };

    Records.get(formRecord)
      .load(defAtts)
      .then(data => {
        if (!data.definition) {
          Records.get('eform@DEFAULT')
            .load(defAtts)
            .then(data => {
              if (!data.canWrite) {
                processPreSettings(data.definition);
                return;
              }

              processFormDefinition(data.definition);
            });
        } else {
          if (!data.canWrite) {
            processPreSettings(data.definition);
            return;
          }

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
      // eslint-disable-next-line react/no-deprecated
      const editor = ReactDOM.render(componentInstance, container);

      builders[componentKey] = editor;
      editor.show(showData, onSubmit, options);
    }
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.EcosFormBuilderUtils = EcosFormBuilderUtils;
