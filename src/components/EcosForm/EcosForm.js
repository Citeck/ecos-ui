import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Formio from 'formiojs/Formio';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';

import '../../forms';
import CustomEventEmitter from '../../forms/EventEmitter';
import { getCurrentLocale, getMLValue, isMobileDevice, strSplice, t } from '../../helpers/util';
import { PROXY_URI } from '../../constants/alfresco';
import Records from '../Records';
import EcosFormBuilder from './builder/EcosFormBuilder';
import EcosFormBuilderModal from './builder/EcosFormBuilderModal';
import EcosFormUtils from './EcosFormUtils';
import { LANGUAGE_EN } from '../../constants/lang';
import { FORM_MODE_EDIT } from './constants';

import './formio.full.min.css';
import './glyphicon-to-fa.scss';
import '../../forms/style.scss';

let formCounter = 0;

class EcosForm extends React.Component {
  _formBuilderModal = null;
  _formContainer = React.createRef();
  _form = null;
  _containerHeightTimerId = null;
  _formSubmitDoneResolve = () => undefined;
  _cachedFormComponents = [];
  _lastFormOptions = null;

  constructor(props) {
    super(props);

    this.state = {
      containerId: 'ecos-ui-form-' + formCounter++,
      ...this.initState
    };
  }

  componentWillUnmount() {
    Records.releaseAll(this.state.containerId);

    if (this._form) {
      this._form.destroy();
    }

    window.clearTimeout(this._containerHeightTimerId);
    window.removeEventListener('scroll', this.onScrollWindow, true);
  }

  componentDidMount() {
    const record = Records.getRecordToEdit(this.props.record);

    this.setState({ recordId: record.id }, () => {
      this.initForm();
    });

    window.addEventListener('scroll', this.onScrollWindow, true);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.formId !== this.props.formId || !isEqual(prevProps.options, this.props.options)) {
      this.setState({ ...this.initState }, this.initForm);
      this._cachedFormComponents = [];
    }

    if (prevProps.record !== this.props.record) {
      const record = Records.getRecordToEdit(this.props.record);

      this.setState({ recordId: record.id }, () => {
        this.initForm();
      });
    }
  }

  get initState() {
    return {
      formId: 'form@',
      error: null,
      formDefinition: {}
    };
  }

  get recoverableComponentsProperties() {
    return {
      tabs: ['currentTab']
    };
  }

  get form() {
    return this._form;
  }

  setRefFormBuilderModal = element => {
    if (element) {
      this._formBuilderModal = element;
    }
  };

  initForm(newFormDefinition = this.state.formDefinition) {
    const constants = get(window, 'Citeck.constants') || {};
    const { record, formKey, options: propsOptions, formId, getTitle, clonedRecord, initiator } = this.props;
    const { recordId, containerId } = this.state;
    const options = cloneDeep(propsOptions);
    const attributes = {
      definition: 'definition?json',
      customModule: 'customModule',
      title: 'title',
      i18n: 'i18n?json',
      width: 'width',
      formId: '?localId'
    };

    let formLoadingPromise;
    let proxyUri = PROXY_URI || '/';

    this._lastFormOptions = propsOptions;

    if (formId) {
      formLoadingPromise = EcosFormUtils.getFormById(formId, attributes);
    } else {
      formLoadingPromise = EcosFormUtils.getForm(record, formKey, attributes);
    }

    options.recordId = recordId;
    options.isMobileDevice = options.ecosIsMobile || isMobileDevice();
    options.formSubmitDonePromise = new Promise(resolve => (this._formSubmitDoneResolve = resolve));

    proxyUri = proxyUri.substring(0, proxyUri.length - 1);
    Formio.setProjectUrl(proxyUri);

    if (constants.USERNAME) {
      Formio.setUser(constants.USERNAME);
    }

    const onFormLoadingFailure = () => {
      this.setState({ error: new Error(t('ecos-form.empty-form-data')) });
      isFunction(this.props.onReady) && this.props.onReady();
    };

    formLoadingPromise.then(formData => {
      if (this._lastFormOptions !== propsOptions) {
        return;
      }

      isFunction(getTitle) && !!get(formData, 'title') && getTitle(formData.title);

      if (!formData || !formData.definition) {
        onFormLoadingFailure();
        return null;
      }

      const container = get(this._formContainer, 'current');

      if (container) {
        const modal = container.closest('.ecos-modal');

        if (modal && formData.width && formData.width !== 'default') {
          modal.classList.remove('ecos-modal_width-lg');
          modal.classList.add(`ecos-modal_width-${formData.width}`);
        }
      }

      const customModulePromise = new Promise(function(resolve) {
        if (formData.customModule) {
          window.require([formData.customModule], Module => resolve(new Module.default({ recordId })));
        } else {
          resolve({});
        }
      });

      const originalFormDefinition = Object.keys(newFormDefinition).length ? newFormDefinition : formData.definition;
      const formDefinition = EcosFormUtils.preProcessFormDefinition(originalFormDefinition, options);

      this.setState({ originalFormDefinition, formDefinition, formId: formData.formId });

      if (this._formBuilderModal) {
        this._formBuilderModal.setStateData({ formId: formData.formId });
      }

      const inputs = EcosFormUtils.getFormInputs(formDefinition);
      const recordDataPromise = EcosFormUtils.getData(clonedRecord || recordId, inputs, containerId);
      const isDebugModeOn = options.ecosIsDebugOn || localStorage.getItem('enableLoggerForNewForms') === 'true';

      let canWritePromise = false;

      if (options.readOnly && options.viewAsHtml) {
        canWritePromise = EcosFormUtils.hasWritePermission(recordId, true);
      }

      if (isDebugModeOn) {
        options.isDebugModeOn = isDebugModeOn;
      }

      Promise.all([recordDataPromise, canWritePromise]).then(([recordData, canWrite]) => {
        if (this._lastFormOptions !== propsOptions) {
          return;
        }

        if (canWrite) {
          options.canWrite = canWrite;
        }

        const attributesTitles = {};

        for (let input of recordData.inputs) {
          if (input.component && input.edge) {
            if (input.edge.protected) {
              input.component.disabled = true;
            }

            if (input.edge.unreadable) {
              input.component.disabled = true;
              input.component.unreadable = true;
            }

            if (input.edge.title) {
              attributesTitles[getMLValue(input.component.label)] = input.edge.title;
            }
          }
        }

        const i18n = options.i18n || {};
        const language = options.language || getCurrentLocale();
        const defaultI18N = i18n[language] || {};
        let currentLangTranslate = {};
        let enTranslate = {};

        // cause: https://citeck.atlassian.net/browse/ECOSUI-1327
        const translateKeys = (!!formData.i18n && Object.keys(formData.i18n)) || [];
        const translations = translateKeys.reduce((result, key) => {
          const translate = EcosFormUtils.getI18n(defaultI18N, attributesTitles, formData.i18n[key]);

          if (key === language) {
            currentLangTranslate = translate;
          }

          if (key === LANGUAGE_EN) {
            enTranslate = translate;
          }

          return {
            ...result,
            ...translate
          };
        }, {});

        i18n[language] = {
          ...translations,
          ...enTranslate,
          ...currentLangTranslate
        };

        options.theme = EcosFormUtils.getThemeName();
        options.language = language;
        options.i18n = i18n;
        options.events = new CustomEventEmitter({
          wildcard: false,
          maxListeners: 0,
          loadLimit: 200,
          onOverload: () => !!this._form && this._form.showErrors(t('ecos-form.infinite-loop'))
        });
        options.initiator = initiator;

        const containerElement = document.getElementById(containerId);

        if (!containerElement) {
          return;
        }

        this._recoverComponentsProperties(formDefinition);

        const formPromise = Formio.createForm(containerElement, formDefinition, options);

        Promise.all([formPromise, customModulePromise]).then(formAndCustom => {
          if (this._lastFormOptions !== propsOptions) {
            return;
          }

          const data = {
            ...this._evalOptionsInitAttributes(recordData.inputs, options),
            ...(this.props.attributes || {}),
            ...recordData.submission
          };
          const [form, customModule] = formAndCustom;
          const HANDLER_PREFIX = 'onForm';

          form.ecos = { custom: customModule, form: this };
          form.setValue({ data });
          form.on('submit', (submission, resolve, reject) => this.submitForm(form, submission, false, resolve, reject));
          form.on(
            'change',
            debounce(
              submission => {
                if (options.formMode === FORM_MODE_EDIT && EcosFormUtils.isFormChangedByUser(submission)) {
                  isFunction(this.props.onFormChanged) && this.props.onFormChanged(submission, this.form);
                }
              },
              1000,
              { trailing: true }
            )
          );

          Object.keys(this.props)
            .filter(key => key.startsWith(HANDLER_PREFIX))
            .map(prop => {
              const str = prop.replace(HANDLER_PREFIX, '');
              const event = strSplice(str, 0, 1, str[0].toLowerCase());
              return { prop, event };
            })
            .forEach(o => {
              if (o.event !== 'submit') {
                form.on(o.event, data => {
                  const fun = this.props[o.prop];
                  isFunction(fun) && fun.apply(form, [...arguments, data]);
                });
              } else {
                console.warn('Please use onSubmit handler instead of onFormSubmit');
              }
            });

          form.formReady.then(() => {
            if (this._lastFormOptions !== propsOptions) {
              return;
            }

            isFunction(this.props.onReady) && this.props.onReady(form);

            this._containerHeightTimerId = window.setTimeout(() => this.toggleContainerHeight(), 500);

            isFunction(this.props.onReadyToSubmit) &&
              EcosFormUtils.isComponentsReadyWaiting(form.components).then(state => this.props.onReadyToSubmit(form, state));
          });

          this._form = form;

          isFunction(customModule.init) && customModule.init({ form });
        });
      });
    }, onFormLoadingFailure);
  }

  _evalOptionsInitAttributes(inputs, options) {
    const typeRef = options.typeRef;

    if (!typeRef) {
      return {};
    }

    let hasTypeField = false;
    for (let input of inputs) {
      if (input.attribute === 'tk:kind' || input.attribute === '_type') {
        hasTypeField = true;
        break;
      }
    }
    if (!hasTypeField) {
      return {
        _type: typeRef
      };
    }
    return {};
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
    const handlerName = 'on' + event.charAt(0).toUpperCase() + event.slice(1);

    if (isFunction(this.props[handlerName])) {
      this.props[handlerName](data);
    }
  }

  toggleLoader = state => {
    const { onToggleLoader } = this.props;

    if (state && get(this.form, 'withoutLoader')) {
      return;
    }

    isFunction(onToggleLoader) && onToggleLoader(state);
  };

  onScrollWindow = event => {
    if (event.target && event.target.classList.contains('choices__list')) {
      return;
    }

    this.onScrollStart();
  };

  onScrollStart = debounce(
    () => {
      if (!this.form) {
        return;
      }

      if (isEmpty(this._cachedFormComponents)) {
        this._cachedFormComponents = this.getComponents(this.form, true);
      }

      this._cachedFormComponents.forEach(item => {
        item.callFunction('hideDropdown');
      });
    },
    500,
    { leading: true }
  );

  onShowFormBuilder = async callback => {
    if (this._formBuilderModal) {
      const { options, onFormSubmitDone } = this.props;
      const { formId } = this.state;
      const definitionToEdit = await Records.get(EcosFormUtils.getNotResolvedFormId(formId)).load('definition?json', true);

      this._formBuilderModal.show(
        definitionToEdit,
        form => {
          EcosFormUtils.saveFormBuilder(form, formId).then(() => {
            EcosFormUtils.getFormById(formId, 'definition?json', true).then(newFormDef => {
              this.initForm(newFormDef);
              isFunction(onFormSubmitDone) && onFormSubmitDone();
              isFunction(callback) && callback(newFormDef);
            });
          });
        },
        options
      );
    }
  };

  submitForm = debounce(
    (form, submission, forceSave = false, submissionResolve, submissionReject) => {
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
      const { typeRef = '' } = form.options;
      const formInfo = {};
      if (typeRef) {
        //_formOptions is deprecated
        sRecord.att('_formOptions', { typeRef });
        formInfo['typeRef'] = typeRef;
      }
      let btnComponents = EcosFormUtils.getButtonComponents(form);
      for (let buttonComponent of btnComponents) {
        if (submission.data[buttonComponent.key] === true) {
          let label = buttonComponent.component.label;
          if (isString(label)) {
            // en - locale by default
            label = { en: label };
          }
          const locales = Object.keys(label);
          if (locales.length === 1 && locales[0] === 'en') {
            const translatedValue = buttonComponent.options.i18next.translator.translate(label['en']);
            if (translatedValue) {
              label = { en: translatedValue };
            }
          }
          formInfo['submitName'] = label;
        }
      }
      if (this.state.formId) {
        formInfo['formId'] = this.state.formId;
      }
      sRecord.att('_formInfo', formInfo);

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

        if (isFunction(submissionResolve)) {
          submissionResolve({ persistedRecord, form, record });
        }
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

      if (forceSave || this.props.saveOnSubmit !== false) {
        sRecord
          .save()
          .then(persistedRecord => {
            onSubmit(persistedRecord, form, sRecord);
          })
          .catch(e => {
            form.showErrors(e, true);
            resetOutcomeButtonsValues();

            if (isFunction(submissionReject)) {
              submissionReject(e);
            }
          })
          .finally(() => {
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
      this._cachedFormComponents = [];
    }

    this.toggleContainerHeight(true);
  }

  toggleContainerHeight(toSave = false) {
    const container = get(this._formContainer, 'current');

    if (container) {
      container.style.height = toSave ? `${container.offsetHeight}px` : 'auto';
    }
  }

  getComponents = (component, ignoreSelf = false) => {
    const components = [];

    if (!ignoreSelf) {
      components.push(component);
    }

    if (component.components) {
      components.push(...this.getInternalComponents(component));
    }

    if (component.rows) {
      components.push(...this.getInternalRows(component));
    }

    return components;
  };

  getInternalComponents = component => {
    const components = [];

    if (isEmpty(component.components)) {
      return components;
    }

    for (let i = 0; i < component.components.length; i++) {
      components.push(...this.getComponents(component.components[i]));
    }

    return components;
  };

  getInternalRows = component => {
    const components = [];

    if (!component.rows) {
      return components;
    }

    for (let i = 0; i < component.rows.length; i++) {
      Object.keys(component.rows[i]).forEach(key => {
        components.push(...this.getComponents(component.rows[i][key]));
      });
    }

    return components;
  };

  render() {
    const { className } = this.props;
    const { error, containerId } = this.state;

    if (error) {
      return <div className={classNames('ecos-ui-form__error', className)}>{error.message}</div>;
    }

    return (
      <div className={className}>
        <div id={containerId} ref={this._formContainer} />
        <EcosFormBuilderModal ref={this.setRefFormBuilderModal} />
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
  getTitle: PropTypes.func,
  onSubmit: PropTypes.func,
  onReady: PropTypes.func, // Form ready, but not rendered yet
  onReadyToSubmit: PropTypes.func,
  onFormCancel: PropTypes.func,
  /**
   * @see https://github.com/formio/formio.js/wiki/Form-Renderer#events
   */
  onFormSubmitDone: PropTypes.func,
  onFormChange: PropTypes.func,
  onFormRender: PropTypes.func,
  onFormPrevPage: PropTypes.func,
  onFormNextPage: PropTypes.func,
  onToggleLoader: PropTypes.func,
  // -----
  saveOnSubmit: PropTypes.bool,
  className: PropTypes.string,

  initiator: PropTypes.shape({
    type: PropTypes.string.isRequired,
    name: PropTypes.string
  }) // initiator of form creation
};

EcosForm.defaultProps = {
  className: '',
  builderModalIsShow: false,
  options: {}
};

export default EcosForm;
export { EcosForm, EcosFormBuilder, EcosFormBuilderModal };
