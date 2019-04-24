import React from 'react';
import PropTypes from 'prop-types';
import Formio from 'formiojs/Formio';
import FormBuilder from 'formiojs/FormBuilder';
import Records from '../Records';

import './formio.full.min.css';
import './glyphicon-to-fa.scss';
import '../../forms/style.scss';

const EDGE_PREFIX = 'edge__';

let formCounter = 0;

class EcosForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      containerId: 'ecos-ui-form-' + formCounter++
    };
  }

  componentDidMount() {
    let recordId = this.props.record;
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
            } else {
              submissionData[att] = recordData[att];
            }
          }
        }

        let formDefinition = JSON.parse(JSON.stringify(formData.definition));

        EcosForm.forEachComponent(formDefinition, component => {
          if (component.key && (edgesData[component.key] || {}).protected) {
            component.disabled = true;
          }
        });

        let i18n = options.i18n || {};
        let existingI18NRu = i18n.ru || {};

        i18n.ru = {
          complete: 'Сохранение прошло успешно',
          error: 'Пожалуйста, исправьте следующие ошибки перед отправкой:',
          invalid_date: '{{field}} некорректная дата.',
          invalid_email: '{{field}} некорректный email.',
          invalid_regex: '{{field}} не соответствует паттерну {{regex}}.',
          mask: '{{field}} не совпадает с маской.',
          max: '{{field}} не может быть больше чем {{max}}.',
          maxLength: '{{field}} должен быть короче чем {{length}} символов.',
          min: '{{field}} не может быть меньше чем {{min}}.',
          minLength: '{{field}} должен быть длиннее чем {{length}} символов.',
          next: 'Далее',
          pattern: '{{field}} не совпадает с паттерном {{pattern}}',
          previous: 'Назад',
          required: 'Поле {{field}} не может быть пустым',
          ...existingI18NRu
        };

        options.i18n = i18n;

        if (!options.language) {
          let lang = navigator.language || navigator.userLanguage || 'ru';
          if (lang.indexOf('ru') === 0) {
            options.language = 'ru';
          } else if (lang.indexOf('en') === 0) {
            options.language = 'en';
          }
        }

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

  fireEvent(event, data) {
    var handlerName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);
    if (this.props[handlerName]) {
      this.props[handlerName](data);
    }
  }

  submitForm(form, submission) {
    var self = this;

    let inputs = EcosForm.getFormInputs(form.component);
    let keysMapping = {};

    for (let i = 0; i < inputs.length; i++) {
      keysMapping[inputs[i].component.key] = inputs[i].schema;
    }

    let record = Records.get(this.props.record);

    for (let key in submission.data) {
      if (submission.data.hasOwnProperty(key)) {
        record.att(keysMapping[key] || key, submission.data[key]);
      }
    }

    record.save().then(record => {
      if (self.props.onSubmit) {
        self.props.onSubmit(record);
      }
    });
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
          default:
            attributeSchema = 'str';
        }

        let multiplePostfix = component.multiple ? 's' : '';
        let schema = '.att' + multiplePostfix + '(n:"' + attribute + '"){' + attributeSchema + '}';
        let edgeSchema = '.edge(n:"' + attribute + '"){protected,type}';

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
    return Records.query({
      query: {
        sourceId: 'eform',
        query: {
          record: this.props.record,
          formKey: this.props.formKey
        }
      },
      attributes: {
        formDef: 'definition?json',
        customModule: 'customModule'
      }
    }).then(data => {
      let formAtts = data.records[0];

      return Promise.resolve({
        definition: formAtts.formDef,
        customModule: formAtts.customModule
      });
    });
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
export { FormBuilder, EcosForm };
