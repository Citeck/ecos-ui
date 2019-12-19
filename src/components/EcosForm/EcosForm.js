import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Formio from 'formiojs/Formio';
import CustomEventEmitter from '../../forms/EventEmitter';
import { cloneDeep } from 'lodash';

import '../../forms/components';
import Records from '../Records';
import EcosFormBuilder from './builder/EcosFormBuilder';
import EcosFormBuilderModal from './builder/EcosFormBuilderModal';
import EcosFormUtils from './EcosFormUtils';
import { getCurrentLocale, isMobileDevice, t } from '../../helpers/util';
import { PROXY_URI } from '../../constants/alfresco';

import './formio.full.min.css';
import './glyphicon-to-fa.scss';
import '../../forms/style.scss';

export const FORM_MODE_CREATE = 'CREATE';
export const FORM_MODE_EDIT = 'EDIT';

let formCounter = 0;

class EcosForm extends React.Component {
  _formBuilderModal = React.createRef();
  _form = null;

  constructor(props) {
    super(props);

    let record = Records.getRecordToEdit(this.props.record);

    this.state = {
      containerId: 'ecos-ui-form-' + formCounter++,
      recordId: record.id,
      ...this.initState
    };
  }

  componentWillUnmount() {
    Records.releaseAll(this.state.containerId);
    if (this._form) {
      this._form.destroy();
    }
  }

  componentDidMount() {
    this.initForm();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.formId !== this.props.formId) {
      this.setState({ ...this.initState });
      this.initForm();
    }
  }

  get initState() {
    return {
      formId: 'eform@',
      error: null,
      formDefinition: {}
    };
  }

  initForm(newFormDefinition = this.state.formDefinition) {
    const { record, formKey, options: propsOptions, formId } = this.props;
    const { recordId } = this.state;

    const options = cloneDeep(propsOptions);
    let formLoadingPromise = null;
    const attributes = {
      definition: 'definition?json',
      customModule: 'customModule',
      i18n: 'i18n?json'
    };

    if (formId) {
      formLoadingPromise = EcosFormUtils.getFormById(formId, attributes);
    } else {
      formLoadingPromise = EcosFormUtils.getForm(record, formKey, attributes);
    }

    options.recordId = recordId;
    options.isMobileDevice = isMobileDevice();

    let alfConstants = (window.Alfresco || {}).constants || {};
    let proxyUri = PROXY_URI || '/';

    proxyUri = proxyUri.substring(0, proxyUri.length - 1);
    Formio.setProjectUrl(proxyUri);

    if (alfConstants.USERNAME) {
      Formio.setUser(alfConstants.USERNAME);
    }

    let self = this;

    formLoadingPromise.then(
      formData => {
        if (!formData || !formData.definition) {
          self.setState({
            error: new Error(t('ecos-form.empty-form-data'))
          });
          self.props.onReady && self.props.onReady();
          return null;
        }

        this.setState({ formId: formData.id });

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
        let recordDataPromise = EcosFormUtils.getData(recordId, inputs, this.state.containerId);
        let canWritePromise = false;
        if (options.readOnly && options.viewAsHtml) {
          canWritePromise = EcosFormUtils.hasWritePermission(recordId);
        }

        Promise.all([recordDataPromise, canWritePromise]).then(([recordData, canWrite]) => {
          if (canWrite) {
            options.canWrite = canWrite;
          }

          const definition = Object.keys(newFormDefinition).length ? newFormDefinition : formData.definition;
          let formDefinition = cloneDeep(definition);

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

          let language = options.language || getCurrentLocale();
          options.language = language;

          let defaultI18N = i18n[language] || {};
          let formI18N = (formData.i18n || {})[language] || {};

          i18n[language] = EcosFormUtils.getI18n(defaultI18N, attributesTitles, formI18N);

          options.i18n = i18n;
          options.events = new CustomEventEmitter({
            wildcard: false,
            maxListeners: 0,
            loadLimit: 200,
            onOverload: () => {
              if (this._form) {
                this._form.showErrors('Infinite loop detected');
              }
            }
          });

          const containerElement = document.getElementById(this.state.containerId);
          if (!containerElement) {
            return;
          }

          let formPromise = Formio.createForm(containerElement, formDefinition, options);

          Promise.all([formPromise, customModulePromise]).then(formAndCustom => {
            let form = formAndCustom[0];
            let customModule = formAndCustom[1];

            this._form = form;

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
      },
      () => {
        self.setState({
          error: new Error(t('ecos-form.error-get-form'))
        });
        self.props.onReady && self.props.onReady();
        return null;
      }
    );
  }

  fireEvent(event, data) {
    let handlerName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);

    if (this.props[handlerName]) {
      this.props[handlerName](data);
    }
  }

  onShowFormBuilder = callback => {
    if (this._formBuilderModal.current) {
      const { formDefinition, formId } = this.state;

      this._formBuilderModal.current.show(formDefinition, form => {
        EcosFormUtils.saveFormBuilder(form, formId).then(() => {
          this.initForm(form);
          this.props.onFormSubmitDone();
          typeof callback === 'function' && callback(form);
        });
      });
    }
  };

  submitForm(form, submission) {
    let self = this;

    let inputs = EcosFormUtils.getFormInputs(form.component);
    let keysMapping = EcosFormUtils.getKeysMapping(inputs);
    let inputByKey = EcosFormUtils.getInputByKey(inputs);

    let record = Records.get(this.state.recordId);

    if (submission.state) {
      record.att('_state', submission.state);
    }

    for (let key in submission.data) {
      if (submission.data.hasOwnProperty(key)) {
        let value = submission.data[key];
        let input = inputByKey[key];

        if (input && input.type === 'horizontalLine') {
          continue;
        }

        value = EcosFormUtils.processValueBeforeSubmit(value, input, keysMapping);

        record.att(keysMapping[key] || key, value);
      }
    }

    const onSubmit = (persistedRecord, form, record) => {
      Records.releaseAll(this.state.containerId);
      if (self.props.onSubmit) {
        self.props.onSubmit(persistedRecord, form, record);
      }
    };

    if (this.props.saveOnSubmit !== false) {
      record
        .save()
        .then(persistedRecord => {
          onSubmit(persistedRecord, form, record);
        })
        .catch(e => {
          form.showErrors(e, true);
        });
    } else {
      onSubmit(record, form);
    }
  }

  onReload() {
    this.initForm({});
  }

  render() {
    const { className } = this.props;
    const { error, containerId } = this.state;

    if (error) {
      return <div className={classNames('ecos-ui-form__error', className)}>{error.message}</div>;
    }

    return (
      <>
        <div className={classNames(className)} id={containerId} />
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
  formId: PropTypes.string,
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
