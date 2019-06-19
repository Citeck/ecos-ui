import Records from '../Records/Records';
import lodashGet from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import isString from 'lodash/isString';

const EDGE_PREFIX = 'edge__';

export default class EcosFormUtils {
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

    const query = {
      sourceId: 'eform',
      query: {
        record: recordInstance.id,
        formKey: formKey
      }
    };
    if (attributes) {
      return Records.queryOne(query, attributes);
    } else {
      return Records.queryOne(query);
    }
  }

  static getCurrentLanguage() {
    let lang = navigator.language || navigator.userLanguage || 'en';
    return lang.split('_')[0];
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

      if (attribute && component.input === true && component.type !== 'button') {
        let questionIdx = attribute.indexOf('?');

        if (questionIdx !== -1) {
          attribute = attribute.substring(0, questionIdx);
        }

        let attributeSchema;

        let dataType = lodashGet(component, 'ecos.dataType', '');

        switch (component.type) {
          case 'checkbox':
            attributeSchema = 'bool';
            break;
          case 'tableForm':
          case 'selectJournal':
            attributeSchema = 'assoc';
            break;
          case 'file':
            attributeSchema = 'as(n:"content-data"){json}';
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
          edgeSchema: edgeSchema,
          dataType: dataType
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
                submission[att] = EcosFormUtils.initJsonRecord(recordData[att]);
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

  static initJsonRecord(data) {
    if (Array.isArray(data)) {
      let result = [];
      for (let v of data) {
        let record = this.initJsonRecord(v);
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

    let id = data.nodeRef || data.id;

    if (!id) {
      return null;
    }

    let attributes = {};
    if (data.nodeRef) {
      let dataAttributes = data.attributes || [];
      for (let att of dataAttributes) {
        attributes[att.name] = att.value;
      }
    } else if (data.id) {
      for (let att in data) {
        if (att !== 'id' && data.hasOwnProperty(att)) {
          attributes[att] = data[att];
        }
      }
    }

    let record = Records.get(id);
    for (let att in attributes) {
      if (attributes.hasOwnProperty(att)) {
        record.persistedAtt(att, attributes[att]);
      }
    }

    return id;
  }
}
