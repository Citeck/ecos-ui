import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Formio from 'formiojs/Formio';

import '../../forms/components';
import Records from '../Records';
import EcosFormBuilder from './builder/EcosFormBuilder';
import EcosFormBuilderModal from './builder/EcosFormBuilderModal';
import EcosFormUtils from './EcosFormUtils';
import DataGridAssocComponent from './../../forms/components/custom/datagridAssoc/DataGridAssoc';
import { t, deepClone } from '../../helpers/util';

import './formio.full.min.css';
import './glyphicon-to-fa.scss';
import '../../forms/style.scss';

export const FORM_MODE_CREATE = 'CREATE';
export const FORM_MODE_EDIT = 'EDIT';

let formCounter = 0;

class EcosForm extends React.Component {
  _formBuilderModal = React.createRef();

  constructor(props) {
    super(props);

    let record = Records.getRecordToEdit(this.props.record);

    this.state = {
      containerId: 'ecos-ui-form-' + formCounter++,
      recordId: record.id,
      error: null,
      form: null,
      formDefinition: {}
    };
  }

  componentDidMount() {
    this.initForm();
  }

  initForm(newFormDefinition = this.state.formDefinition) {
    console.warn('initForm');
    const { record, formKey, options: propsOptions } = this.props;
    const { recordId } = this.state;
    const options = deepClone(propsOptions);
    let formLoadingPromise = EcosFormUtils.getForm(record, formKey, {
      definition: 'definition?json',
      customModule: 'customModule',
      i18n: 'i18n?json'
    });

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
      console.warn('formData: ', formData);

      if (!formData) {
        self.setState({
          error: new Error(t('ecos-form.empty-form-data'))
        });
        return null;
      }

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

      let inputs = EcosFormUtils.getFormInputs(formData.definition);
      let recordDataPromise = EcosFormUtils.getData(recordId, inputs);

      recordDataPromise.then(recordData => {
        const definition = Object.keys(newFormDefinition).length ? newFormDefinition : formData.definition;
        let formDefinition = deepClone(definition);

        this.setState({ formDefinition });

        let attributesTitles = {};
        EcosFormUtils.forEachComponent(formDefinition, component => {
          let edgeData = recordData.edges[component.key] || {};

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

        let language = options.language || EcosFormUtils.getCurrentLanguage();
        options.language = language;

        let defaultI18N = i18n[language] || {};
        let formI18N = (formData.i18n || {})[language] || {};

        i18n[language] = EcosFormUtils.getI18n(defaultI18N, attributesTitles, formI18N);

        options.i18n = i18n;

        const containerElement = document.getElementById(this.state.containerId);
        if (!containerElement) {
          return;
        }

        let formPromise = Formio.createForm(containerElement, formDefinition, options);

        if (this.state.form) {
          return;
        }

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
              ...recordData.submission
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
                  console.warn('Other Event: ', event, form, arguments);
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

          this.setState({ form });
          // console.warn(form);
        });
      });
    });
  }

  fireEvent(event, data) {
    let handlerName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);

    if (this.props[handlerName]) {
      this.props[handlerName](data);
    }
  }

  onShowFormBuilder = () => {
    if (this._formBuilderModal.current) {
      this._formBuilderModal.current.show(this.state.formDefinition, formBuilder => {
        console.warn(formBuilder, this.state.form);
        // this.state.form.onSubmit(formBuilder.submission, true);
        this.initForm(formBuilder.form);
        this.submitForm(this.state.form, formBuilder.submission);
        // this.fireEvent('builderSubmit', formBuilder.submission);
        // console.warn(this.props);
        // this.props.onSubmit(formDefinition);
        // this.submitForm(formDefinition);
      });
    }
  };

  submitForm(form, submission) {
    let self = this;

    console.warn('submitForm: ', form, submission);

    let inputs = EcosFormUtils.getFormInputs(form.component);
    let keysMapping = {};
    let inputByKey = {};

    for (let i = 0; i < inputs.length; i++) {
      let key = inputs[i].component.key;
      keysMapping[key] = inputs[i].schema;
      inputByKey[key] = inputs[i];
    }

    let record = Records.get(this.state.recordId);

    for (let key in submission.data) {
      if (submission.data.hasOwnProperty(key)) {
        let value = submission.data[key];
        let input = inputByKey[key];

        if (value && input && input.dataType === 'json-record') {
          const mapping = v => JSON.stringify(Records.get(v).toJson());

          if (Array.isArray(value)) {
            value = value.map(mapping);
          } else {
            value = mapping(value);
          }
        }

        if (value && input && input.component.type === 'datagridAssoc') {
          value = DataGridAssocComponent.convertToAssoc(value, input, keysMapping);
        }

        record.att(keysMapping[key] || key, value);
      }
    }

    if (submission.state) {
      console.warn('submission.state', submission.state);
      record.att('_state', submission.state);
    }

    let onSubmit = self.props.onSubmit || (() => {});

    if (this.props.saveOnSubmit !== false) {
      record
        .save()
        .then(persistedRecord => {
          onSubmit(persistedRecord, form, record);
        })
        .catch(e => {
          form.showErrors(e);
        });
    } else {
      onSubmit(record, form);
    }
  }

  render() {
    const { className } = this.props;
    let self = this;

    if (this.state.error) {
      return <div className={classNames('ecos-ui-form__error', className)}>{self.state.error.message}</div>;
    }

    return (
      <>
        <div className={classNames(className)} id={this.state.containerId} />
        <EcosFormBuilderModal ref={this._formBuilderModal} />
      </>
    );
  }
}

EcosForm.propTypes = {
  record: PropTypes.string,
  attributes: PropTypes.object,
  options: PropTypes.object,
  formKey: PropTypes.string,
  onSubmit: PropTypes.func,
  onReady: PropTypes.func, // Form ready, but not rendered yet
  onFormCancel: PropTypes.func,
  // See https://github.com/formio/formio.js/wiki/Form-Renderer#events
  onFormSubmitDone: PropTypes.func,
  onFormChange: PropTypes.func,
  onFormRender: PropTypes.func,
  onFormPrevPage: PropTypes.func,
  onFormNextPage: PropTypes.func,
  // -----
  saveOnSubmit: PropTypes.bool,
  className: PropTypes.string
};

EcosForm.defaultProps = {
  className: '',
  builderModalIsShow: false,
  options: {}
};

export default EcosForm;
export { EcosForm, EcosFormBuilder, EcosFormBuilderModal };
