import React from 'react';
import PropTypes from 'prop-types';
import Formio from 'formiojs/Formio';
import Records from '../Records';
import lodashGet from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import EcosFormBuilder from './builder/EcosFormBuilder';

import './formio.full.min.css';
import './glyphicon-to-fa.scss';
import '../../forms/style.scss';

const EDGE_PREFIX = 'edge__';

let formCounter = 0;

class EcosForm extends React.Component {
  constructor(props) {
    super(props);

    let record = Records.getRecordToEdit(this.props.record);

    this.state = {
      containerId: 'ecos-ui-form-' + formCounter++,
      recordId: record.id
    };
  }

  componentDidMount() {
    let recordId = this.state.recordId;

    let formLoadingPromise = this.getForm();

    let options = this.props.options || {};
    options.recordId = recordId;

    let alfConstants = (window.Alfresco || {}).constants || {};

    let proxyUri = alfConstants.PROXY_URI || '/';
    proxyUri = proxyUri.substring(0, proxyUri.length - 1);
    Formio.setProjectUrl(proxyUri);

    if (alfConstants.USERNAME) {
      Formio.setUser(alfConstants.USERNAME);
    }

    let self = this;

    formLoadingPromise.then(formData => {
      let customModulePromise = new Promise(function(resolve, reject) {
        if (formData.customModule) {
          window.require([formData.customModule], function(Module) {
            resolve(
              new Module.default({
                recordId: recordId
              })
            );
          });
        } else {
          resolve({});
        }
      });

      let inputs = EcosForm.getFormInputs(formData.definition);
      let recordDataPromise = EcosForm.getData(recordId, inputs);

      recordDataPromise.then(recordData => {
        let edgesData = {};
        let submissionData = {};

        for (let att in recordData) {
          if (recordData.hasOwnProperty(att)) {
            if (att.indexOf(EDGE_PREFIX) === 0) {
              edgesData[att.substring(EDGE_PREFIX.length)] = recordData[att];
            } else if (recordData[att] !== null) {
              submissionData[att] = recordData[att];
            }
          }
        }

        let formDefinition = JSON.parse(JSON.stringify(formData.definition));

        let attributesTitles = {};
        EcosForm.forEachComponent(formDefinition, component => {
          let edgeData = edgesData[component.key] || {};

          if (component.key) {
            if (edgeData.protected) {
              component.disabled = true;
            }
            if (edgeData.title) {
              attributesTitles[component.label] = edgeData.title;
            }
          }
        });

        let i18n = options.i18n || {};

        let language = options.language || EcosForm.getCurrentLanguage();
        options.language = language;

        let defaultI18N = i18n[language] || {};
        let formI18N = (formData.i18n || {})[language] || {};

        i18n[language] = EcosForm.getI18n(defaultI18N, attributesTitles, formI18N);

        options.i18n = i18n;

        let formPromise = Formio.createForm(document.getElementById(this.state.containerId), formDefinition, options);

        Promise.all([formPromise, customModulePromise]).then(formAndCustom => {
          let form = formAndCustom[0];
          let customModule = formAndCustom[1];
          form.ecos = {
            custom: customModule
          };

          if (customModule.init) {
            customModule.init({
              form: form
            });
          }

          form.submission = {
            data: {
              ...(self.props.attributes || {}),
              ...submissionData
            }
          };

          form.on('submit', submission => {
            self.submitForm(form, submission);
          });

          let handlersPrefix = 'onForm';

          for (let key in self.props) {
            if (self.props.hasOwnProperty(key) && key.startsWith(handlersPrefix)) {
              let event = key.slice(handlersPrefix.length).toLowerCase();

              if (event !== 'submit') {
                form.on(event, () => {
                  self.props[key].apply(form, arguments);
                });
              } else {
                console.warn('Please use onSubmit handler instead of onFormSubmit');
              }
            }
          }

          if (self.props.onReady) {
            self.props.onReady(form);
          }
        });
      });
    });
  }

  static getCurrentLanguage() {
    let lang = navigator.language || navigator.userLanguage || 'en';
    return lang.split('_')[0];
  }

  fireEvent(event, data) {
    let handlerName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
    if (this.props[handlerName]) {
      this.props[handlerName](data);
    }
  }

  submitForm(form, submission) {
    let self = this;

    let inputs = EcosForm.getFormInputs(form.component);
    let keysMapping = {};

    for (let i = 0; i < inputs.length; i++) {
      keysMapping[inputs[i].component.key] = inputs[i].schema;
    }

    let record = Records.get(this.state.recordId);

    for (let key in submission.data) {
      if (submission.data.hasOwnProperty(key)) {
        record.att(keysMapping[key] || key, submission.data[key]);
      }
    }

    let onSubmit = self.props.onSubmit || (() => {});

    if (this.props.saveOnSubmit !== false) {
      record.save().then(record => {
        onSubmit(record, form);
      });
    } else {
      onSubmit(record, form);
    }
  }

  static forEachComponent(root, action) {
    let components = [];

    if (root.type === 'columns') {
      components = root.columns || [];
    } else {
      components = root.components || [];
    }

    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      action(component);
      this.forEachComponent(component, action);
    }
  }

  static getComponentAttribute(component) {
    return (component.properties || {}).attribute || component.key;
  }

  static getFormInputs(root, inputs) {
    if (!inputs) {
      inputs = [];
    }

    this.forEachComponent(root, component => {
      let attribute = EcosForm.getComponentAttribute(component);

      if (attribute && component.input === true && component.type !== 'button') {
        let questionIdx = attribute.indexOf('?');

        if (questionIdx !== -1) {
          attribute = attribute.substring(0, questionIdx);
        }

        let attributeSchema;

        switch (component.type) {
          case 'checkbox':
            attributeSchema = 'bool';
            break;
          case 'selectJournal':
            attributeSchema = 'assoc';
            break;
          default:
            attributeSchema = 'str';
        }

        let multiplePostfix = component.multiple ? 's' : '';
        let schema = '.att' + multiplePostfix + '(n:"' + attribute + '"){' + attributeSchema + '}';
        let edgeSchema = '.edge(n:"' + attribute + '"){protected,';
        if (component.label === attribute) {
          edgeSchema += 'title}';
        } else {
          // Type is not used. Just to add more than 1 field in result to avoid simplifying
          // result: {protected:true} -> result: true
          edgeSchema += 'type}';
        }

        inputs.push({
          attribute: attribute,
          component: component,
          schema: schema,
          edgeSchema: edgeSchema
        });
      }
    });

    return inputs;
  }

  static getI18n(defaultI18n, attributes, formI18n) {
    let global = lodashGet(window, 'Alfresco.messages.global', {});

    let result = cloneDeep(defaultI18n);

    const globalPrefix = 'ecos.forms.';
    for (let key in global) {
      if (global.hasOwnProperty(key) && key.indexOf(globalPrefix) === 0) {
        result[key.substring(globalPrefix.length)] = global[key];
      }
    }

    return Object.assign(result, attributes, formI18n);
  }

  static getData(recordId, inputs) {
    if (!recordId) {
      return Promise.resolve({});
    }

    let attributes = {};
    for (let input of inputs) {
      let key = input.component.key;
      if (key) {
        attributes[key] = input.schema;
        attributes[EDGE_PREFIX + key] = input.edgeSchema;
      }
    }

    return Records.get(recordId).load(attributes);
  }

  render() {
    return <div id={this.state.containerId} />;
  }

  getForm() {
    return Records.queryOne(
      {
        sourceId: 'eform',
        query: {
          record: this.props.record,
          formKey: this.props.formKey
        }
      },
      {
        definition: 'definition?json',
        customModule: 'customModule',
        i18n: 'i18n?json'
      }
    );
  }
}

EcosForm.propTypes = {
  record: PropTypes.string,
  attributes: PropTypes.object,
  options: PropTypes.object,
  formKey: PropTypes.string,
  onSubmit: PropTypes.func,
  onReady: PropTypes.func
  // onForm[Event]: PropTypes.func (for example, onFormCancel)
};

export default EcosForm;
export { EcosForm, EcosFormBuilder };
