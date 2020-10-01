import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Formio from 'formiojs/Formio';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

import '../../forms';
import CustomEventEmitter from '../../forms/EventEmitter';
import { getCurrentLocale, isMobileDevice, t } from '../../helpers/util';
import { PROXY_URI } from '../../constants/alfresco';
import Records from '../Records';
import EcosFormBuilder from './builder/EcosFormBuilder';
import EcosFormBuilderModal from './builder/EcosFormBuilderModal';
import EcosFormUtils from './EcosFormUtils';

import './formio.full.min.css';
import './glyphicon-to-fa.scss';
import '../../forms/style.scss';

export const FORM_MODE_CLONE = 'CLONE';
export const FORM_MODE_CREATE = 'CREATE';
export const FORM_MODE_EDIT = 'EDIT';

let formCounter = 0;

class EcosForm extends React.Component {
  _formBuilderModal = React.createRef();
  _formContainer = React.createRef();
  _form = null;
  _containerHeightTimerId = null;
  _formSubmitDoneResolve = () => {};

  constructor(props) {
    super(props);

    const record = Records.getRecordToEdit(this.props.record);

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
    window.clearTimeout(this._containerHeightTimerId);
  }

  componentDidMount() {
    this.initForm();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.formId !== this.props.formId || !isEqual(prevProps.options, this.props.options)) {
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

  get recoverableComponentsProperties() {
    return {
      tabs: ['currentTab']
    };
  }

  initForm(newFormDefinition = this.state.formDefinition) {
    const { record, formKey, options: propsOptions, formId, getTitle, clonedRecord } = this.props;
    const { recordId, containerId } = this.state;
    const self = this;
    const options = cloneDeep(propsOptions);
    const attributes = {
      definition: 'definition?json',
      customModule: 'customModule',
      title: 'title',
      i18n: 'i18n?json'
    };

    let formLoadingPromise;
    let alfConstants = (window.Alfresco || {}).constants || {};
    let proxyUri = PROXY_URI || '/';

    if (formId) {
      formLoadingPromise = EcosFormUtils.getFormById(formId, attributes);
    } else {
      formLoadingPromise = EcosFormUtils.getForm(record, formKey, attributes);
    }

    options.recordId = recordId;
    options.isMobileDevice = isMobileDevice();
    options.formSubmitDonePromise = new Promise(resolve => {
      this._formSubmitDoneResolve = resolve;
    });

    proxyUri = proxyUri.substring(0, proxyUri.length - 1);
    Formio.setProjectUrl(proxyUri);

    if (alfConstants.USERNAME) {
      Formio.setUser(alfConstants.USERNAME);
    }

    const onFormLoadingFailure = () => {
      self.setState({ error: new Error(t('ecos-form.empty-form-data')) });
      self.props.onReady && self.props.onReady();
    };

    formLoadingPromise.then(formData => {
      if (formData && formData.title) {
        getTitle && getTitle(formData.title);
      }

      if (!formData || !formData.definition) {
        onFormLoadingFailure();
        return null;
      }

      const customModulePromise = new Promise(function(resolve) {
        if (formData.customModule) {
          window.require([formData.customModule], function(Module) {
            resolve(new Module.default({ recordId }));
          });
        } else {
          resolve({});
        }
      });

      const originalFormDefinition = Object.keys(newFormDefinition).length ? newFormDefinition : formData.definition;
      const formDefinition = EcosFormUtils.preProcessFormDefinition(originalFormDefinition, options);

      self.setState({ originalFormDefinition, formDefinition });

      const inputs = EcosFormUtils.getFormInputs(formDefinition);
      const recordDataPromise = EcosFormUtils.getData(clonedRecord || recordId, inputs, containerId);
      const isDebugModeOn = localStorage.getItem('enableLoggerForNewForms');

      let canWritePromise = false;

      if (options.readOnly && options.viewAsHtml) {
        canWritePromise = EcosFormUtils.hasWritePermission(recordId, true);
      }

      if (isDebugModeOn) {
        options.isDebugModeOn = isDebugModeOn;
      }

      Promise.all([recordDataPromise, canWritePromise]).then(([recordData, canWrite]) => {
        if (canWrite) {
          options.canWrite = canWrite;
        }

        const attributesTitles = {};

        for (let input of recordData.inputs) {
          if (input.component && input.edge) {
            if (input.edge.protected) {
              input.component.disabled = true;
            }
            if (input.edge.title) {
              attributesTitles[input.component.label] = input.edge.title;
            }
          }
        }

        const i18n = options.i18n || {};
        const language = options.language || getCurrentLocale();
        const defaultI18N = i18n[language] || {};
        const formI18N = (formData.i18n || {})[language] || {};

        i18n[language] = EcosFormUtils.getI18n(defaultI18N, attributesTitles, formI18N);
        options.theme = EcosFormUtils.getThemeName();
        options.language = language;
        options.i18n = i18n;
        options.events = new CustomEventEmitter({
          wildcard: false,
          maxListeners: 0,
          loadLimit: 200,
          onOverload: () => {
            if (self._form) {
              self._form.showErrors('Infinite loop detected');
            }
          }
        });

        const containerElement = document.getElementById(containerId);

        if (!containerElement) {
          return;
        }

        self._recoverComponentsProperties(formDefinition);

        const formPromise = Formio.createForm(containerElement, formDefinition, options);

        Promise.all([formPromise, customModulePromise]).then(formAndCustom => {
          const form = formAndCustom[0];
          const customModule = formAndCustom[1];
          const handlersPrefix = 'onForm';

          self._form = form;
          form.ecos = { custom: customModule };

          if (customModule.init) {
            customModule.init({ form });
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

          for (const key in self.props) {
            if (self.props.hasOwnProperty(key) && key.startsWith(handlersPrefix)) {
              const event = key.slice(handlersPrefix.length).toLowerCase();

              if (event !== 'submit') {
                form.on(event, () => {
                  self.props[key].apply(form, arguments);
                });
              } else {
                console.warn('Please use onSubmit handler instead of onFormSubmit');
              }
            }
          }

          self.setState({ formId: formData.id });

          if (self.props.onReady) {
            self.props.onReady(form);
          }

          form.ready.then(() => {
            self._containerHeightTimerId = window.setTimeout(() => {
              self.toggleContainerHeight();
            }, 500);
          });
        });
      });
    }, onFormLoadingFailure);
  }

  _recoverComponentsProperties(formDefinition) {
    if (!this._form) {
      return;
    }

    const components = {};

    EcosFormUtils.forEachComponent(formDefinition, component => (components[component.id] = component));

    EcosFormUtils.forEachComponent(this._form, prevDefinitionComponent => {
      const component = components[prevDefinitionComponent.id];
      if (!component) {
        return;
      }

      const recoverableProperties = this.recoverableComponentsProperties[component.type] || [];
      if (isEmpty(recoverableProperties)) {
        return;
      }

      recoverableProperties.forEach(property => {
        const propertyValue = prevDefinitionComponent[property];
        if (propertyValue === undefined) {
          return;
        }
        component[property] = propertyValue;
      });
    });
  }

  fireEvent(event, data) {
    let handlerName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);

    if (this.props[handlerName]) {
      this.props[handlerName](data);
    }
  }

  toggleLoader = state => {
    const { onToggleLoader } = this.props;

    if (typeof onToggleLoader !== 'function') {
      return;
    }

    onToggleLoader(state);
  };

  onShowFormBuilder = callback => {
    if (this._formBuilderModal.current) {
      const { originalFormDefinition, formId } = this.state;

      this._formBuilderModal.current.show(originalFormDefinition, form => {
        EcosFormUtils.saveFormBuilder(form, formId).then(() => {
          this.initForm(form);
          this.props.onFormSubmitDone();
          typeof callback === 'function' && callback(form);
        });
      });
    }
  };

  submitForm = debounce(
    (form, submission) => {
      const self = this;
      const { recordId, containerId } = this.state;
      const inputs = EcosFormUtils.getFormInputs(form.component);
      const allComponents = form.getAllComponents();
      const keysMapping = EcosFormUtils.getKeysMapping(inputs);
      const inputByKey = EcosFormUtils.getInputByKey(inputs);
      const sRecord = Records.get(recordId);

      if (submission.state) {
        sRecord.att('_state', submission.state);
      }

      for (const key in submission.data) {
        if (submission.data.hasOwnProperty(key)) {
          const input = inputByKey[key];

          let value = submission.data[key];

          const excludeComponents = ['horizontalLine', 'asyncData', 'taskOutcome'];
          if (input && input.component && excludeComponents.includes(input.component.type)) {
            continue;
          }

          value = EcosFormUtils.processValueBeforeSubmit(value, input, keysMapping);

          const attName = keysMapping[key] || key;

          const currentComponent = allComponents.find(item => get(item, 'component.key', '') === key);
          if (!currentComponent || EcosFormUtils.isOutcomeButton(currentComponent.component)) {
            sRecord.att(attName, value);
          } else {
            const isPersistent = get(currentComponent, 'component.persistent', true);
            switch (isPersistent) {
              case true:
                sRecord.att(attName, value);
                break;
              case 'client-only':
                sRecord.persistedAtt(attName, value);
                break;
              default:
                sRecord.removeAtt(attName);
            }
          }
        }
      }

      const onSubmit = (persistedRecord, form, record) => {
        Records.releaseAll(containerId);

        if (self.props.onSubmit) {
          self.props.onSubmit(persistedRecord, form, record);
        }

        this._formSubmitDoneResolve({ persistedRecord, form, record });
      };

      const resetOutcomeButtonsValues = () => {
        const allComponents = form.getAllComponents();
        const outcomeButtonsKeys = [];

        allComponents.forEach(item => {
          if (EcosFormUtils.isOutcomeButton(item.component)) {
            outcomeButtonsKeys.push(item.component.key);
          }
        });

        for (const field in form.data) {
          if (!form.data.hasOwnProperty(field)) {
            continue;
          }

          if (outcomeButtonsKeys.includes(field)) {
            form.data[field] = undefined;
          }
        }
      };

      self.toggleLoader(true);

      if (this.props.saveOnSubmit !== false) {
        sRecord
          .save()
          .then(persistedRecord => {
            onSubmit(persistedRecord, form, sRecord);
          })
          .catch(e => {
            form.showErrors(e, true);
            resetOutcomeButtonsValues();
          })
          .finally(() => {
            // TODO This may not be the best solution.
            //  But at the moment it works for
            //  https://citeck.atlassian.net/browse/ECOSUI-64
            sRecord.reset();
            self.toggleLoader(false);
          });
      } else {
        onSubmit(sRecord, form);
        self.toggleLoader(false);
      }
    },
    3000,
    {
      leading: true,
      trailing: false
    }
  );

  onReload(withSaveState) {
    if (withSaveState) {
      this.initForm(this.state.formDefinition);
    } else {
      this.setState({ ...this.initState });
      this.initForm({});
    }

    this.toggleContainerHeight(true);
  }

  toggleContainerHeight(toSave = false) {
    const container = get(this._formContainer, 'current');

    if (container) {
      container.style.height = toSave ? `${container.offsetHeight}px` : 'auto';
    }
  }

  render() {
    const { className } = this.props;
    const { error, containerId } = this.state;

    if (error) {
      return <div className={classNames('ecos-ui-form__error', className)}>{error.message}</div>;
    }

    return (
      <div className={className}>
        <div id={containerId} ref={this._formContainer} />
        <EcosFormBuilderModal ref={this._formBuilderModal} />
      </div>
    );
  }
}

EcosForm.propTypes = {
  record: PropTypes.string,
  clonedRecord: PropTypes.string,
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
  onToggleLoader: PropTypes.func,
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
