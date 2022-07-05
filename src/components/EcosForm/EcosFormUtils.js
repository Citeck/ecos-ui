import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import uuidV4 from 'uuid/v4';
import { NotificationManager } from 'react-notifications';
import isEmpty from 'lodash/isEmpty';
import lodashGet from 'lodash/get';
import lodashSet from 'lodash/set';
import first from 'lodash/first';
import isPlainObject from 'lodash/isPlainObject';
import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import omitBy from 'lodash/omitBy';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import isUndefined from 'lodash/isUndefined';

import { AppEditions, SourcesId } from '../../constants';
import { OUTCOME_BUTTONS_PREFIX } from '../../constants/forms';
import { getCurrentUserName, getMLValue, t } from '../../helpers/util';
import { UserApi } from '../../api/user';
import { AppApi } from '../../api/app';
import { Components } from '../../forms/components';
import DataGridAssocComponent from '../../forms/components/custom/datagridAssoc/DataGridAssoc';
import Modal from '../common/EcosModal/CiteckEcosModal';
import Records from '../Records';
import EcosForm from './EcosForm';
import { FORM_MODE_CREATE, FORM_MODE_EDIT } from './constants';

const SOURCE_DIVIDER = '@';
const EDGE_PREFIX = 'edge__';
const NOT_INPUT_TYPES = ['container', 'datagrid', 'button', 'horizontalLine'];

const getComponentInnerAttSchema = component => {
  let dataType = lodashGet(component, 'ecos.dataType', '');
  if (!dataType) {
    dataType = lodashGet(component, 'properties.dataType', '');
  }

  switch (dataType) {
    case 'json':
    case 'query':
      return 'json';
    case 'bool':
      return 'bool';
    default:
      break;
  }

  switch (component.type) {
    case 'number':
      return lodashGet(component, 'isBigNumber', false) ? 'str' : 'num';
    case 'checkbox':
      return 'bool';
    case 'datagridAssoc':
    case 'tableForm':
    case 'selectJournal':
      return 'assoc';
    case 'datamap':
    case 'mlText':
    case 'mlTextarea':
      return 'json';
    case 'file':
      return 'as(n:"content-data"){json}';
    default:
      return 'str';
  }
};

export default class EcosFormUtils {
  static _apiApp = new AppApi();
  static _apiUser = new UserApi();

  static isCurrentUserInGroup(group) {
    const currentPersonName = getCurrentUserName();

    return Records.queryOne(
      {
        query: 'TYPE:"cm:authority" AND =cm:authorityName:"' + group + '"',
        language: 'fts-alfresco'
      },
      'cm:member[].cm:userName'
    ).then(function(userNames) {
      return (userNames || []).indexOf(currentPersonName) !== -1;
    });
  }

  static eform(record, config) {
    if (!config) {
      config = {};
    }

    if (!config.reactstrapProps) {
      config.reactstrapProps = {};
    }

    if (!config.reactstrapProps.backdrop) {
      config.reactstrapProps.backdrop = 'static';
    }

    if (!config.reactstrapProps.keyboard) {
      config.reactstrapProps.keyboard = false;
    }

    const modal = config.formContainer ? null : new Modal();
    const formParams = Object.assign({ record }, config.params || {});
    const configParams = config.params || {};

    formParams['options'] = configParams.options || {};

    formParams['onSubmit'] = function(record, form, alias) {
      if (modal) {
        modal.close();
      }

      if (configParams.onSubmit) {
        configParams.onSubmit(record, form, alias);
      }
    };

    formParams['onFormCancel'] = function(record, form) {
      if (modal) {
        modal.close();
      }

      if (configParams.onFormCancel) {
        configParams.onFormCancel(record, form);
      }
    };

    formParams['onReady'] = function() {
      setTimeout(function(record, form) {
        if (configParams.onReady) {
          configParams.onReady(record, form);
        }
      }, 100);
    };

    const instanceRec = Records.get(record);
    instanceRec
      .load({
        displayName: '.disp',
        formMode: '_formMode'
      })
      .then(function(recordData) {
        const formMode = config.formMode || recordData.formMode || FORM_MODE_EDIT;

        if (formMode === FORM_MODE_CREATE) {
          Records.get(record).reset();
        }

        const options = formParams.options || {};

        options.formMode = formMode;
        formParams.options = options;

        const formInstance = React.createElement(EcosForm, formParams);

        config.header = EcosFormUtils.getFormTitle(recordData);

        if (config.formContainer) {
          let container = config.formContainer;

          if (isString(config.formContainer)) {
            container = document.getElementById(config.formContainer);
          }

          ReactDOM.render(formInstance, container);
        } else {
          if (configParams.onFormCancel || configParams.onCancel) {
            config.onHideModal = () => {
              if (configParams.onFormCancel) {
                configParams.onFormCancel();
              }
              if (configParams.onCancel) {
                configParams.onCancel();
              }
            };
          }

          modal.open(formInstance, config);
        }
      });
  }

  static getButtonComponents(form) {
    const components = [];
    EcosFormUtils.forEachComponent(form, component => {
      if (component.type === 'button') {
        components.push(component);
      }
    });
    return components;
  }

  static editRecord(config) {
    const recordRef = config.recordRef,
      fallback = config.fallback,
      formMode = config.formMode || FORM_MODE_EDIT,
      formKey = config.formKey;

    const showForm = recordRef => {
      const params = {
        attributes: config.attributes || {},
        onSubmit: config.onSubmit
      };

      if (formKey) {
        params.formKey = config.formKey;
      }

      if (config.onCancel) {
        params.onCancel = config.onCancel;
      }

      if (config.onFormCancel) {
        params.onFormCancel = config.onFormCancel;
      }

      if (config.contentBefore) {
        params.contentBefore = config.contentBefore;
        EcosFormUtils.eform(recordRef, {
          params,
          class: 'ecos-modal_width-lg',
          isBigHeader: true,
          formMode,
          formContainer: config.formContainer || null
        });
      } else {
        if (typeof fallback === 'function') {
          fallback();
        }
      }

      if (config.contentAfter) {
        params.contentAfter = config.contentAfter;
      }

      if (config.options) {
        params.options = config.options;
      }

      EcosFormUtils.eform(recordRef, {
        params,
        class: 'ecos-modal_width-lg',
        isBigHeader: true,
        formContainer: config.formContainer || null
      });
    };

    EcosFormUtils.hasForm(recordRef)
      .then(result => {
        if (result) {
          showForm(recordRef);
        } else {
          if (isFunction(fallback)) {
            fallback();
          } else {
            NotificationManager.error(t('ecos-form.error.no-form'), t('error'));
          }
        }
      })
      .catch(e => {
        const msg = 'Exception in hasForm request. RecordRef: ' + recordRef;
        console.error(msg, e);
        NotificationManager.error(t('form-is-not-available'), t('error'));
        throw new Error(msg);
      });
  }

  static cloneRecord({ clonedRecord, createVariant, saveOnSubmit }) {
    return new Promise((resolve, reject) => {
      let { recordRef, formKey } = createVariant || {};
      const newRecord = Records.getRecordToEdit(recordRef);
      const formAttributes = { definition: 'definition?json' };
      const formPromise = EcosFormUtils.getForm(newRecord, formKey, formAttributes);

      formPromise.then(formData => {
        if (!formData || !formData.definition) {
          NotificationManager.error(t('ecos-form.error.clone-get-fields'), t('error'));
          reject(null);
        }

        const formDefinition = cloneDeep(formData.definition);
        const inputs = EcosFormUtils.getFormInputs(formDefinition);
        const recordDataPromise = EcosFormUtils.getClonedData(clonedRecord, inputs);
        const onSuccess = result => {
          NotificationManager.success(t('ecos-form.success.clone-record'), t('success'));
          resolve(result);
        };

        recordDataPromise
          .then(data => {
            for (let att in data) {
              if (data.hasOwnProperty(att)) {
                newRecord.att(att, data[att]);
              }
            }

            if (saveOnSubmit === false) {
              onSuccess(newRecord);
            } else {
              newRecord
                .save()
                .then(onSuccess)
                .catch(e => Promise.reject(e));
            }
          })
          .catch(e => {
            console.error(e);
            reject(null);
            NotificationManager.error(t('ecos-form.error.clone-record'), t('error'));
          });
      });
    });
  }

  static isNewFormsEnabled() {
    return Records.get('ecos-config@ecos-forms-enable').load('.bool');
  }

  static hasForm(recordRef, formKey = null) {
    if (!recordRef) {
      return Promise.resolve(false);
    }

    return this.getForm(recordRef, formKey)
      .then(record => record !== null)
      .catch(err => {
        console.error(err);
        return false;
      });
  }

  static async getForm(record, formKey = null, attributes = null) {
    const recordInstance = isString(record) ? Records.get(record) : record;
    const baseRecord = recordInstance.getBaseRecord();

    const getFormByKeysFromRecord = (keys, idx) => {
      if (!keys || idx >= keys.length) {
        return null;
      }

      const query = {
        sourceId: SourcesId.RESOLVED_FORM,
        query: {
          record: baseRecord.id,
          formKey: keys[idx]
        }
      };

      const formRec = Records.queryOne(query, attributes);

      return formRec.then(res => {
        if (res) {
          return res;
        }

        return getFormByKeysFromRecord(keys, idx + 1);
      });
    };

    if (!formKey) {
      const attrs = {
        formKey: '_formKey[]?str',
        typeId: '_type?id',
        // legacy attribute. _type is preferred
        etypeId: '_etype?id',
        formRef: '_formRef?id'
      };
      let recordAtts = await baseRecord.load(attrs);

      if (!(recordAtts.formKey || []).length && !recordAtts.typeId && !recordAtts.etypeId && !recordAtts.formRef) {
        recordAtts = await recordInstance.load(attrs);
      }

      let { typeId, etypeId, formKey, formRef } = recordAtts;

      if (!typeId) {
        typeId = etypeId;
      }

      if (EcosFormUtils.isFormId(formRef)) {
        return EcosFormUtils.getFormById(formRef, attributes);
      }
      if (typeId && typeId.indexOf('emodel/type@') === 0) {
        return Records.get(typeId)
          .load('inhFormRef?id')
          .then(formId => {
            if (EcosFormUtils.isFormId(formId)) {
              return EcosFormUtils.getFormById(formId, attributes);
            } else {
              return getFormByKeysFromRecord(formKey, 0);
            }
          })
          .catch(e => {
            console.error(e);
            return getFormByKeysFromRecord(formKey, 0);
          });
      } else {
        return getFormByKeysFromRecord(formKey, 0);
      }
    } else {
      return getFormByKeysFromRecord([formKey], 0);
    }
  }

  static getFormById(formId, attributes = null, force = false) {
    let resolvedFormId = EcosFormUtils.getResolvedFormId(formId);
    if (attributes) {
      return Records.get(resolvedFormId).load(attributes, force);
    }
    return Records.get(resolvedFormId);
  }

  static getNotResolvedFormId(formId) {
    return EcosFormUtils.getFormIdWithSource(formId, SourcesId.FORM);
  }

  static getResolvedFormId(formId) {
    return EcosFormUtils.getFormIdWithSource(formId, SourcesId.RESOLVED_FORM);
  }

  static getFormIdWithSource(formId, sourceId) {
    if (!formId) {
      return formId;
    }
    const sourceIdDelimIdx = formId.indexOf(SOURCE_DIVIDER);
    if (sourceIdDelimIdx > 0) {
      formId = formId.substring(sourceIdDelimIdx + 1);
    }
    return sourceId + SOURCE_DIVIDER + formId;
  }

  static getCreateVariants(record, attribute) {
    let recordInstance = isString(record) ? Records.get(record) : record;
    let variantsPromise = recordInstance.load('#' + attribute + '?createVariants');

    return variantsPromise.then(variants => {
      if (!variants) {
        return [];
      }

      let hasFormPromises = variants.map(v => EcosFormUtils.getForm(v.recordRef, v.formKey, 'formKey'));

      return Promise.all(hasFormPromises).then(hasForms => {
        return variants.filter((v, idx) => {
          let formKey = hasForms[idx];
          if (!formKey) {
            return false;
          }
          v.formKey = formKey;
          return true;
        });
      });
    });
  }

  static preProcessFormDefinition(formDefinition, formOptions) {
    const newFormDefinition = cloneDeep(formDefinition);

    EcosFormUtils.forEachComponent(newFormDefinition, component => {
      if (component.key) {
        if (component.properties) {
          for (let key in component.properties) {
            if (!component.properties.hasOwnProperty(key)) {
              continue;
            }
            let value = component.properties[key];
            if (first(value) === '$') {
              component.properties[key] = EcosFormUtils._replaceOptionValuePlaceholder(value, formOptions);
            }
          }
        }
        for (let key in component) {
          if (!component.hasOwnProperty(key)) {
            continue;
          }
          let value = component[key];
          if (key === 'label' && isPlainObject(value)) {
            for (let labelKey in value) {
              if (value.hasOwnProperty(labelKey)) {
                const langValue = value[labelKey];
                if (isString(langValue) && first(langValue) === '$') {
                  value[labelKey] = EcosFormUtils._replaceOptionValuePlaceholder(langValue, formOptions);
                }
              }
            }
          } else if (isString(value) && first(value) === '$') {
            component[key] = EcosFormUtils._replaceOptionValuePlaceholder(value, formOptions);
          }
        }
      }
    });

    return newFormDefinition;
  }

  static _replaceOptionValuePlaceholder(value, options) {
    let match = /\${options\['(.+)']}/.exec(value);
    if (match != null) {
      return options[match[1]];
    }
    return value;
  }

  static forEachComponent(root, action, scope = null) {
    let components = [];

    if (root) {
      if (root.type === 'columns') {
        components = root.columns || [];
      } else {
        components = root.components || [];
      }
    }

    let currentScope = scope;
    if (root.type === 'container' || root.type === 'datagrid') {
      currentScope = {
        parent: scope,
        component: root
      };
      if (scope) {
        currentScope.root = scope.root;
        currentScope.path = scope.path + '.' + root.key;
        if (!scope.children) {
          scope.children = [];
        }
        scope.children.push(currentScope);
      } else {
        currentScope.root = currentScope;
        currentScope.path = root.key;
      }
      if (root.multiple) {
        currentScope.path = currentScope.path + '[]';
      }
    }

    const children = [];
    for (let i = 0; i < components.length; i++) {
      let component = components[i];
      const modifiedComponent = action(component, currentScope);
      if (modifiedComponent) {
        component = modifiedComponent;
      }

      component = this.forEachComponent(component, action, currentScope);
      children.push(component);
    }

    const modifiedRoot = {
      ...root
    };

    if (children.length) {
      modifiedRoot[root.type === 'columns' ? 'columns' : 'components'] = children;
    }

    return modifiedRoot;
  }

  // Cause: https://citeck.atlassian.net/browse/ECOSUI-1569
  static _checkAndAddDefaultFields(component = {}, defaultSchema = {}, ignoredFields = []) {
    const componentSchema = cloneDeep(component);

    Object.keys(defaultSchema).forEach(key => {
      const componentData = componentSchema[key];
      const defaultData = defaultSchema[key];

      if (isUndefined(componentData) && !isEmpty(defaultData) && !ignoredFields.includes(key)) {
        componentSchema[key] = defaultData;
      }
    });

    return componentSchema;
  }

  static optimizeFormSchema(form) {
    const objectAtts = ['conditional', 'validate', 'widget'];
    const leaveAtts = ['key', 'type', 'input'];
    const removeAtts = ['id'];

    return EcosFormUtils.forEachComponent(form, function(comp) {
      const currentComponent = Components.components[comp.type];
      if (!currentComponent) {
        return comp;
      }

      const currentComponentDefaultSchema = currentComponent ? currentComponent.schema() : {};

      if (isFunction(currentComponent.optimizeSchema)) {
        comp = currentComponent.optimizeSchema(EcosFormUtils._checkAndAddDefaultFields(comp, currentComponentDefaultSchema, objectAtts));
      }

      objectAtts.forEach(att => {
        if (comp[att]) {
          comp[att] = omitBy(comp[att], (value, key) => isEqual(currentComponentDefaultSchema[att][key], value));
        }
      });

      return omitBy(comp, (attValue, attName) => {
        if (leaveAtts.includes(attName)) {
          return false;
        }

        if (removeAtts.includes(attName)) {
          return true;
        }

        if ([...objectAtts, 'attributes', 'properties'].includes(attName) && isEmpty(attValue)) {
          return true;
        }

        // Cause: https://citeck.atlassian.net/browse/ECOSUI-612
        if (attName === 'multiple' && attValue === true) {
          return false;
        }

        return isEqual(currentComponentDefaultSchema[attName], attValue);
      });
    });
  }

  static getComponentAttribute(component) {
    return (component.properties || {}).attribute || component.key;
  }

  static getRecordFormInputsMap(record) {
    return EcosFormUtils.getForm(record, null, 'definition?json')
      .then(formDef => {
        if (!formDef) {
          return {};
        }
        let inputs = this.getFormInputs(formDef) || [];
        let result = {};
        for (let input of inputs) {
          result[input.attribute] = input;
        }
        return result;
      })
      .catch(err => {
        console.error(err);
        return {};
      });
  }

  static getSchemaForScopedAttribute(innerSchema, scope) {
    if (!scope) {
      return innerSchema;
    }

    if (first(innerSchema) === '.') {
      innerSchema = innerSchema.substring(1);
    }

    const component = scope.component;
    const attribute = EcosFormUtils.getComponentAttribute(component);

    let multiplePostfix = component.multiple ? 's' : '';
    let schema = '.att' + multiplePostfix + '(n:"' + attribute + '"){' + innerSchema + '}';

    return this.getSchemaForScopedAttribute(schema, scope.parent);
  }

  static getFormInputs(root, inputs) {
    if (!inputs) {
      inputs = [];
    }

    this.forEachComponent(root, (component, scope) => {
      let attribute = EcosFormUtils.getComponentAttribute(component);

      if (!attribute || component.input !== true || NOT_INPUT_TYPES.indexOf(component.type) >= 0) {
        return;
      }

      let questionIdx = attribute.indexOf('?');

      if (questionIdx !== -1) {
        attribute = attribute.substring(0, questionIdx);
      }

      let currentScope = {
        parent: scope,
        component
      };

      let innerAttSchema = getComponentInnerAttSchema(component);
      let schema = this.getSchemaForScopedAttribute(innerAttSchema, currentScope);

      let edgeSchema = '.edge(n:"' + attribute + '"){protected,unreadable,';

      if (getMLValue(component.label) === attribute) {
        edgeSchema += 'title}';
      } else {
        // Type is not used. Just to add more than 1 field in result to avoid simplifying
        // result: {protected:true} -> result: true
        edgeSchema += 'type}';
      }

      edgeSchema = this.getSchemaForScopedAttribute(edgeSchema, scope);

      inputs.push({
        scope: scope,
        attribute: attribute,
        component: component,
        schema: schema,
        edgeSchema: edgeSchema,
        dataType: lodashGet(component, 'ecos.dataType', '')
      });
    });

    return inputs;
  }

  static getKeysMapping(inputs) {
    let keysMapping = {};

    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      let key = input.component.key;
      if (input.scope) {
        keysMapping[input.scope.path + '.' + key] = input.schema;
      } else {
        keysMapping[key] = input.schema;
      }
    }

    return keysMapping;
  }

  static getInputByKey(inputs) {
    let inputByKey = {};

    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      let key = input.component.key;
      if (input.scope) {
        inputByKey[input.scope.path + '.' + key] = input;
      } else {
        inputByKey[key] = input;
      }
    }
    return inputByKey;
  }

  static getThemeName() {
    return lodashGet(window, 'Citeck.config.theme');
  }

  static getI18n(defaultI18n, attributes, formI18n) {
    let global = lodashGet(window, 'Citeck.messages.ecosForms', {});

    let result = cloneDeep(defaultI18n);

    const globalPrefix = 'ecos.forms.';
    for (let key in global) {
      if (global.hasOwnProperty(key) && key.indexOf(globalPrefix) === 0) {
        result[key.substring(globalPrefix.length)] = global[key];
      }
    }

    return Object.assign(result, attributes, formI18n);
  }

  static async hasWritePermission(recordId, force) {
    let res = await Records.get(recordId).load('.att(n:"permissions"){has(n:"Write")}', force);
    return res == null ? true : res;
  }

  static processValueBeforeSubmit(value, input, keysMapping) {
    const mapEachValue = (value, mapping) => {
      if (Array.isArray(value)) {
        return value.map(mapping);
      } else {
        return mapping(value);
      }
    };

    if (value && input && input.dataType === 'json-record') {
      value = mapEachValue(value, v => JSON.stringify(Records.get(v).toJson()));
    }
    if (value && input && input.dataType === 'json') {
      const type = (input.component || {}).type;

      if (type === 'textarea') {
        value = JSON.parse(value);
      } else {
        value = mapEachValue(value, v => {
          let recData = (Records.get(v).toJson() || {}).attributes || {};
          let result = {};

          for (let att in recData) {
            if (
              recData.hasOwnProperty(att) &&
              att.charAt(0) !== '.' &&
              att !== '_alias' &&
              att !== '_state' &&
              att !== 'submit' &&
              //id should be in att_id
              att !== 'id'
            ) {
              if (att === 'att_id') {
                result['id'] = recData[att];
              } else {
                result[att] = recData[att];
              }
            }
          }

          return result;
        });
      }
    }

    if (value && input && input.component.type === 'datagridAssoc') {
      value = DataGridAssocComponent.convertToAssoc(value, input, keysMapping);
    }

    /* cause:
    https://citeck.atlassian.net/browse/ECOSCOM-2561
    https://citeck.atlassian.net/browse/ECOSCOM-3204
    https://citeck.atlassian.net/browse/ECOSCOM-3428
    https://citeck.atlassian.net/browse/ECOSUI-622
    */
    if (input && ['select', 'ecosSelect'].includes(input.component.type) && !value) {
      value = input.component.multiple ? [] : null;
    }

    // cause: https://citeck.atlassian.net/browse/ECOSCOM-2581
    if (value && input && input.component.type === 'datetime' && input.component.enableDate && !input.component.enableTime) {
      value = moment(value).format('YYYY-MM-DD[T]00:00:00[Z]');
    }

    return value;
  }

  static preProcessingAttrs(inputs = []) {
    const inputByKey = {};
    const attributes = {};

    for (let input of inputs) {
      let key = input.component.key;

      if (!key) {
        continue;
      }

      let path = (input.scope || {}).path || '';

      path = path ? `${path}.${key}` : key;
      path = input.component.multiple ? `${path}[]` : path;

      inputByKey[path] = input;
      attributes[path] = input.schema;
      attributes[EDGE_PREFIX + path] = input.edgeSchema;
    }

    return { inputByKey, attributes };
  }

  static postProcessingAttrsData({ recordData, inputByKey, ownerId }) {
    const submission = {};

    for (let attPath in recordData) {
      if (!recordData.hasOwnProperty(attPath)) {
        continue;
      }

      if (attPath.indexOf(EDGE_PREFIX) === 0) {
        let input = inputByKey[attPath.substring(EDGE_PREFIX.length)];
        input.edge = recordData[attPath];
        continue;
      }

      const data = recordData[attPath];
      if (data == null) {
        continue;
      }

      const input = inputByKey[attPath];
      const dataType = lodashGet(inputByKey, [attPath, 'dataType']);
      const componentType = lodashGet(inputByKey, [attPath, 'component', 'type']);
      let inputValue;

      if (dataType === 'json-record') {
        inputValue = EcosFormUtils.initJsonRecord(data, ownerId);
      } else if (dataType === 'json' && componentType === 'tableForm') {
        inputValue = EcosFormUtils.initJsonRecord(data, ownerId);
      } else if (dataType === 'json' && componentType === 'textarea') {
        inputValue = JSON.stringify(data || {}, null, 2);
      } else if (componentType === 'file') {
        inputValue = EcosFormUtils.removeEmptyValuesFromArray(data);
      } else if (componentType === 'datetime' && input.component.enableDate && !input.component.enableTime && data) {
        const serverDate = new Date(data);
        serverDate.setHours(serverDate.getHours() + serverDate.getTimezoneOffset() / 60);
        inputValue = serverDate.toISOString();
      } else {
        inputValue = data;
      }

      let attributes = EcosFormUtils.expandArrAttributePath(attPath, inputValue);

      for (let att in attributes) {
        if (attributes.hasOwnProperty(att)) {
          lodashSet(submission, att, attributes[att]);
        }
      }
    }

    return submission;
  }

  static getData(recordId, inputs, ownerId) {
    if (!recordId) {
      return Promise.resolve({});
    }

    const { inputByKey, attributes } = EcosFormUtils.preProcessingAttrs(inputs);

    const recordInstance = Records.get(recordId);
    const force = !recordInstance.isPendingCreate();

    return recordInstance.load(attributes, force).then(recordData => {
      const submission = EcosFormUtils.postProcessingAttrsData({ recordData, inputByKey, ownerId });

      return {
        inputs,
        submission
      };
    });
  }

  static expandArrAttributePath(path, value) {
    let bracketIdx = path.indexOf('[]');
    if (bracketIdx === -1 || !value || !isArray(value)) {
      return { [path]: value };
    }
    let beforeBracket = path.substring(0, bracketIdx);
    let afterBracket = path.substring(bracketIdx + 2);
    let result = {};
    for (let i = 0; i < value.length; i++) {
      let idxPath = beforeBracket + '[' + i + ']' + afterBracket;
      let atts = this.expandArrAttributePath(idxPath, value[i]);
      for (let att in atts) {
        if (atts.hasOwnProperty(att)) {
          result[att] = atts[att];
        }
      }
    }
    return result;
  }

  static getClonedData(recordId, inputs) {
    if (!recordId) {
      return Promise.resolve({});
    }

    let attributes = [];
    for (let input of inputs) {
      attributes.push(input.schema);
    }

    return Records.get(recordId).load(attributes, true);
  }

  static removeEmptyValuesFromArray(data) {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter(item => !isEmpty(item));
  }

  static initJsonRecord(data, ownerId) {
    if (Array.isArray(data)) {
      let result = [];
      for (let v of data) {
        let record = this.initJsonRecord(v, ownerId);
        if (record) {
          result.push(record);
        }
      }
      return result;
    }

    if (isString(data)) {
      if (first(data) === '{') {
        data = JSON.parse(data);
      } else {
        return null;
      }
    }

    let id;
    let attributes = {};

    if (data.attributes) {
      id = data.nodeRef || data.id;

      if (!id) {
        return null;
      }

      if (data.nodeRef) {
        let dataAttributes = data.attributes || [];
        for (let att of dataAttributes) {
          attributes[att.name] = att.value;
        }
      } else if (data.id && data.attributes) {
        attributes = data.attributes;
      }
    } else {
      id = uuidV4();

      for (let att in data) {
        if (data.hasOwnProperty(att)) {
          let attKey = att === 'id' ? 'att_id' : att;
          attributes[attKey] = data[att];
        }
      }
    }

    let record = Records.get(id, ownerId);

    for (let att in attributes) {
      if (attributes.hasOwnProperty(att)) {
        record.persistedAtt(att, attributes[att]);
      }
    }

    return id;
  }

  static saveFormBuilder(definition, formId) {
    const formIdToUpdate = EcosFormUtils.getNotResolvedFormId(formId);
    const record = Records.get(formIdToUpdate);

    record.att('definition?json', definition);

    return record.save();
  }

  static isFormId(formId = '') {
    return formId && /^uiserv\/form@/.test(formId);
  }

  static getFormTitle(data) {
    const displayName = data.typeName || data.displayName || '';
    const formMode = data.formMode || FORM_MODE_EDIT;

    const titleKey = `eform.header.${formMode}.title`;
    const titleVal = t(titleKey);

    const titles = [];

    if (titleVal && titleVal !== titleKey) {
      titles.push(titleVal);
    }

    if (displayName) {
      titles.push(displayName);
    }

    return titles.join(' ');
  }

  static isOutcomeButton(component) {
    return component && component.type === 'button' && component.key.startsWith(OUTCOME_BUTTONS_PREFIX);
  }

  static async isConfigurableForm() {
    const edition = await EcosFormUtils._apiApp.getAppEdition();

    if (edition !== AppEditions.ENTERPRISE) {
      return false;
    }

    return EcosFormUtils._apiUser.isUserAdmin();
  }

  static isComponentsReady(components, options = {}) {
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];

      if (comp.isReadyToSubmit && !comp.isReadyToSubmit()) {
        return false;
      }

      if (comp.components) {
        const result = EcosFormUtils.isComponentsReady(comp.components, options);
        if (!result) {
          return false;
        }
      }
    }

    return true;
  }

  static isComponentsReadyWaiting(components, options = {}) {
    const opt = { attempts: 7, interval: 1000, ...options };

    return new Promise(resolve => {
      let checkTimes = 0;
      const check = () => {
        checkTimes++;

        if (EcosFormUtils.isComponentsReady(components, options)) {
          return resolve(true);
        }

        if (checkTimes >= opt.attempts) {
          return resolve(false);
        }

        setTimeout(check, opt.interval);
      };

      check();
    });
  }

  static getFormMode(instanceRec) {
    const baseRecordId = instanceRec.getBaseRecord().id || SOURCE_DIVIDER;

    if (isString(baseRecordId)) {
      return baseRecordId.endsWith(SOURCE_DIVIDER) ? FORM_MODE_CREATE : FORM_MODE_EDIT;
    }

    return undefined;
  }
}

window.Citeck = window.Citeck || {};
window.Citeck.EcosFormUtils = EcosFormUtils;
