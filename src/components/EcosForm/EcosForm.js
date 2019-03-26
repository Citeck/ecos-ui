import React from 'react';
import PropTypes from 'prop-types';
import Formio from 'formiojs/Formio';
import FormBuilder from 'formiojs/FormBuilder';
import Records from '../Records';

import '../../forms/components/builder';

import './formio.full.min.css';
import './glyphicon-to-fa.scss';
import '../../forms/style.scss';

let formCounter = 0;

class EcosForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      containerId: 'ecos-ui-form-' + formCounter++
    };
  }

  componentDidMount() {
    let self = this;

    this.getForm().then(data => {
      let formAtts = data.records[0].attributes,
        options = self.props.options || {};

      let proxyUri = ((window.Alfresco || {}).constants || {}).PROXY_URI || '/';
      proxyUri = proxyUri.substring(0, proxyUri.length - 1);
      Formio.setProjectUrl(proxyUri);

      Formio.createForm(document.getElementById(this.state.containerId), formAtts.formDef, options).then(form => {
        let recordId = self.props.record;
        form.ecos = {
          recordId: recordId
        };

        let customModule = new Promise(function(resolve, reject) {
          if (formAtts.customModule) {
            window.require([formAtts.customModule], function(Module) {
              resolve(
                new Module.default({
                  form: form,
                  recordId: recordId
                })
              );
            });
          } else {
            resolve({});
          }
        });

        Promise.all([customModule, EcosForm.getData(recordId, form)]).then(data => {
          form.ecos.custom = data[0];

          form.submission = {
            data: {
              ...(self.props.attributes || {}),
              ...data[1]
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

    let inputs = EcosForm.getFormInputs(form);
    let keysMapping = {};

    for (let i = 0; i < inputs.length; i++) {
      keysMapping[inputs[i].component.key] = inputs[i].attribute;
    }

    let record = Records.get(form.ecos.recordId);

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

  static getFormInputs(root, inputs) {
    if (!inputs) {
      inputs = [];
    }

    let components = root.components || [];

    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      let config = component.component;
      if (config.input === true && config.type !== 'button') {
        inputs.push({
          attribute: (config.properties || {}).attribute || config.key,
          component: component
        });
      }
      EcosForm.getFormInputs(component, inputs);
    }

    return inputs;
  }

  static getData(recordId, form) {
    if (!recordId) {
      return new Promise(success => {
        success({});
      });
    }

    let inputs = EcosForm.getFormInputs(form);
    let attributes = {};
    for (let input of inputs) {
      let key = input.component.component.key;
      if (key) {
        attributes[key] = input.attribute;
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
