import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import lodashGet from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';
import Records from '../Records/Records';
import { getCurrentUserName, t } from '../../helpers/util';
import { EcosForm } from '../EcosForm';
import Modal from '../common/EcosModal/CiteckEcosModal';
import DataGridAssocComponent from '../../forms/components/custom/datagridAssoc/DataGridAssoc';
import uuidV4 from 'uuid/v4';

const EDGE_PREFIX = 'edge__';

const getComponentInnerAttSchema = component => {
  let dataType = lodashGet(component, 'ecos.dataType', '');

  if (dataType === 'json') {
    return 'json';
  }

  switch (component.type) {
    case 'number':
      return 'num';
    case 'checkbox':
      return 'bool';
    case 'datagridAssoc':
    case 'tableForm':
    case 'selectJournal':
      return 'assoc';
    case 'datamap':
    case 'container':
      return 'json';
    case 'file':
      return 'as(n:"content-data"){json}';
    default:
      return 'str';
  }
};

export default class EcosFormUtils {
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

  static isShouldDisplayForms() {
    return Records.get('ecos-config@default-ui-left-menu-access-groups')
      .load('.str')
      .then(function(groupsInOneString) {
        if (!groupsInOneString) {
          return false;
        }

        const groups = groupsInOneString.split(',');
        const results = [];

        for (let groupsCounter = 0; groupsCounter < groups.length; ++groupsCounter) {
          results.push(EcosFormUtils.isCurrentUserInGroup(groups[groupsCounter]));
        }

        return Promise.all(results).then(function(values) {
          return values.indexOf(false) === -1;
        });
      });
  }

  static isShouldDisplayFormsForUser() {
    return Records.get('ecos-config@default-ui-main-menu')
      .load('.str')
      .then(function(result) {
        if (result === 'left') {
          return EcosFormUtils.isShouldDisplayForms();
        }
        return false;
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

    let modal = null;

    if (!config.formContainer) {
      modal = new Modal();
    }

    const formParams = Object.assign(
      {
        record: record
      },
      config.params || {}
    );

    const configParams = config.params || {};

    formParams['options'] = configParams.options || {};

    formParams['onSubmit'] = function(record, form) {
      if (modal) {
        modal.close();
      }

      if (configParams.onSubmit) {
        configParams.onSubmit(record, form);
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

    Records.get(record)
      .load({
        displayName: '.disp',
        formMode: '_formMode'
      })
      .then(function(recordData) {
        const displayName = recordData.displayName || '';
        const formMode = recordData.formMode || 'EDIT';

        if (formMode === 'CREATE') {
          Records.get(record).reset();
        }

        const options = formParams.options || {};

        options.formMode = formMode;
        formParams.options = options;

        const prefixId = 'eform.header.' + formMode + '.title';
        const prefix = t(prefixId);

        if (!prefix || prefix === prefixId) {
          config.header = displayName;
        } else {
          config.header = prefix + ' ' + displayName;
        }

        const formInstance = React.createElement(EcosForm, formParams);

        if (config.formContainer) {
          let container = config.formContainer;

          if (typeof config.formContainer === 'string') {
            container = document.getElementById(config.formContainer);
          }

          ReactDOM.render(formInstance, container);
        } else {
          modal.open(formInstance, config);
        }
      });
  }

  static editRecord(config) {
    const recordRef = config.recordRef,
      fallback = config.fallback,
      forceNewForm = config.forceNewForm,
      formKey = config.formKey;

    const showForm = recordRef => {
      if (recordRef) {
        const params = {
          attributes: config.attributes || {},
          onSubmit: config.onSubmit
        };

        if (formKey) {
          params.formKey = config.formKey;
        }

        EcosFormUtils.eform(recordRef, {
          params: params,
          class: 'ecos-modal_width-lg',
          isBigHeader: true,
          formContainer: config.formContainer || null
        });
      } else {
        fallback();
      }
    };

    let isFormsEnabled;

    if (!forceNewForm) {
      isFormsEnabled = Records.get('ecos-config@ecos-forms-enable').load('.bool');
    } else {
      isFormsEnabled = Promise.resolve(true);
    }

    const isShouldDisplay = EcosFormUtils.isShouldDisplayFormsForUser();

    Promise.all([isFormsEnabled, isShouldDisplay])
      .then(function(values) {
        if (values[0] || values[1]) {
          EcosFormUtils.hasForm(recordRef).then(function(result) {
            if (result) {
              showForm(recordRef);
            } else {
              showForm(null);
            }
          });
        } else {
          showForm(null);
        }
      })
      .catch(function(e) {
        console.error(e);
        showForm(null);
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
        console.log(err);
        return false;
      });
  }

  static getForm(record, formKey = null, attributes = null) {
    let recordInstance = isString(record) ? Records.get(record) : record;
    recordInstance = recordInstance.getBaseRecord();

    let getFormByKeysFromRecord = (keys, idx) => {
      if (!keys || idx >= keys.length) {
        return null;
      }

      let query = {
        sourceId: 'uiserv/eform',
        query: {
          record: recordInstance.id,
          formKey: keys[idx]
        }
      };

      let formRec;
      if (attributes) {
        formRec = Records.queryOne(query, attributes);
      } else {
        formRec = Records.queryOne(query);
      }

      return formRec.then(res => {
        if (res) {
          return res;
        } else {
          return getFormByKeysFromRecord(keys, idx + 1);
        }
      });
    };

    if (!formKey) {
      return recordInstance.load('_formKey[]?str').then(keys => {
        return getFormByKeysFromRecord(keys, 0);
      });
    } else {
      return getFormByKeysFromRecord([formKey], 0);
    }
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

  static getFormInputs(root, inputs) {
    if (!inputs) {
      inputs = [];
    }

    this.forEachComponent(root, component => {
      let attribute = EcosFormUtils.getComponentAttribute(component);

      if (!attribute || component.input !== true || component.type === 'button' || component.type === 'horizontalLine') {
        return;
      }

      let questionIdx = attribute.indexOf('?');

      if (questionIdx !== -1) {
        attribute = attribute.substring(0, questionIdx);
      }

      let innerAttSchema = getComponentInnerAttSchema(component);
      let multiplePostfix = component.multiple ? 's' : '';
      let schema = '.att' + multiplePostfix + '(n:"' + attribute + '"){' + innerAttSchema + '}';
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
        edgeSchema: edgeSchema,
        dataType: lodashGet(component, 'ecos.dataType', '')
      });
    });

    return inputs;
  }

  static getKeysMapping(inputs) {
    let keysMapping = {};

    for (let i = 0; i < inputs.length; i++) {
      let key = inputs[i].component.key;
      keysMapping[key] = inputs[i].schema;
    }

    return keysMapping;
  }

  static getInputByKey(inputs) {
    let inputByKey = {};

    for (let i = 0; i < inputs.length; i++) {
      let key = inputs[i].component.key;
      inputByKey[key] = inputs[i];
    }

    return inputByKey;
  }

  static getI18n(defaultI18n, attributes, formI18n) {
    let global = lodashGet(window, 'Alfresco.messages.ecosForms', {});

    let result = cloneDeep(defaultI18n);

    const globalPrefix = 'ecos.forms.';
    for (let key in global) {
      if (global.hasOwnProperty(key) && key.indexOf(globalPrefix) === 0) {
        result[key.substring(globalPrefix.length)] = global[key];
      }
    }

    return Object.assign(result, attributes, formI18n);
  }

  static getCanWritePermission(recordId) {
    return Records.get(recordId).load('.att(n:"permissions"){has(n:"Write")}');
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

    if (value && input && input.component.type === 'datagridAssoc') {
      value = DataGridAssocComponent.convertToAssoc(value, input, keysMapping);
    }

    // cause: https://citeck.atlassian.net/browse/ECOSCOM-2561
    if (input && input.component.type === 'ecosSelect' && !value) {
      value = null;
    }

    // cause: https://citeck.atlassian.net/browse/ECOSCOM-2581
    if (value && input && input.component.type === 'datetime' && input.component.enableDate && !input.component.enableTime) {
      value = moment(value).format('YYYY-MM-DD[T]00:00:00[Z]');
    }

    return value;
  }

  static getData(recordId, inputs, ownerId) {
    if (!recordId) {
      return Promise.resolve({});
    }

    let inputByKey = {};
    let attributes = {};
    for (let input of inputs) {
      let key = input.component.key;
      if (key) {
        inputByKey[key] = input;
        attributes[key] = input.schema;
        attributes[EDGE_PREFIX + key] = input.edgeSchema;
      }
    }

    return Records.get(recordId)
      .load(attributes)
      .then(recordData => {
        let edges = {};
        let submission = {};

        for (let att in recordData) {
          if (recordData.hasOwnProperty(att)) {
            if (att.indexOf(EDGE_PREFIX) === 0) {
              edges[att.substring(EDGE_PREFIX.length)] = recordData[att];
            } else if (recordData[att] !== null) {
              let input = inputByKey[att];
              if (input && input.dataType === 'json-record') {
                submission[att] = EcosFormUtils.initJsonRecord(recordData[att], ownerId);
              } else if (input && input.dataType === 'json' && input.component && input.component.type === 'tableForm') {
                submission[att] = EcosFormUtils.initJsonRecord(recordData[att], ownerId);
              } else if (input && input.component && input.component.type === 'file') {
                submission[att] = EcosFormUtils.removeEmptyValuesFromArray(recordData[att]);
              } else if (
                input &&
                input.component &&
                input.component.type === 'datetime' &&
                input.component.enableDate &&
                !input.component.enableTime
              ) {
                const serverDate = new Date(recordData[att]);
                serverDate.setHours(serverDate.getHours() + serverDate.getTimezoneOffset() / 60);
                submission[att] = serverDate.toISOString();
              } else {
                submission[att] = recordData[att];
              }
            }
          }
        }

        return {
          edges,
          submission
        };
      });
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
      if (data[0] === '{') {
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

  static saveFormBuilder(form, formId) {
    let moduleId = formId.replace('uiserv/eform@', 'eapps/module@form$');
    const record = Records.get(moduleId);

    record.att('definition?json', form);

    return record.save();
  }
}
