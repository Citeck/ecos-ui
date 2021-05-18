import moment from 'moment';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import lodashClone from 'lodash/cloneDeep';

import { deepClone, getTextByLocale, isExistValue, t } from '../helpers/util';
import { DATE_FORMAT, DEFAULT_REF, documentFields, fieldFormatters, NULL_FORM } from '../constants/documents';

export default class DocumentsConverter {
  static formIdIsNull = (id = '') => {
    let isNull = false;

    if (!id) {
      isNull = true;
    }

    if (id === NULL_FORM) {
      isNull = true;
    }

    if (id === 'null') {
      isNull = true;
    }

    return isNull;
  };

  static getAvailableTypes = (types = []) => {
    return types.map(type => ({
      ...type,
      createVariants: isEmpty(type.createVariants) ? {} : type.createVariants,
      actions: isEmpty(type.actions) ? [] : type.actions.filter(action => !isEmpty(action)),
      formId: DocumentsConverter.formIdIsNull(type.formId) ? null : type.formId
    }));
  };

  static getDynamicTypes = ({ types = [], typeNames = {}, countByTypes = [], availableTypes }, locked = false) => {
    if (!types.length) {
      return types;
    }

    return types.map((item, index) => {
      const documents = get(countByTypes, [index], []);
      const createVariants = get(availableTypes.find(i => i.id === item.type), 'createVariants', {});
      let document = {};

      if (documents.length) {
        document = DocumentsConverter.sortByDate({
          data: documents,
          type: 'desc'
        })[0];
      }

      const canUpload = get(item, 'canUpload');

      return {
        ...item,
        canUpload: !isExistValue(canUpload) || canUpload,
        locked: get(item, 'locked', locked),
        formId: DocumentsConverter.formIdIsNull(item.formId) ? null : item.formId,
        name: item.name || get(typeNames, [item.type], t('documents-widget.untitled')),
        countDocuments: documents.length,
        lastDocumentRef: get(document, documentFields.id, ''),
        [documentFields.loadedBy]: get(document, documentFields.loadedBy, ''),
        canDropUpload: (!isExistValue(canUpload) || canUpload) && !createVariants.formRef,
        [documentFields.modified]: DocumentsConverter.getFormattedDate(get(document, documentFields.modified, ''))
      };
    });
  };

  static getDynamicType = (source = {}) => {
    const target = {};

    if (!Object.keys(source).length) {
      return target;
    }
    const canUpload = get(source, 'canUpload');

    target.formId = DocumentsConverter.formIdIsNull(source.formId) ? null : source.formId;
    target.multiple = get(source, 'multiple', false);
    target.mandatory = get(source, 'mandatory', false);
    target.type = get(source, 'type', '');
    target.name = get(source, 'name', t('documents-widget.untitled'));
    target.countDocuments = get(source, 'countDocuments', 0);
    target.locked = get(source, 'locked', false);
    target.canUpload = !isExistValue(canUpload) || canUpload;

    return target;
  };

  static getDocuments = ({ documents, type, typeName }) => {
    return documents.map(document => {
      const target = { ...document };

      if (!document || !Object.keys(document)) {
        return target;
      }

      target.type = type;
      target.typeName = typeName;

      return target;
    });
  };

  static sortByDate = ({ data, byField = 'modified', type = 'asc' }) => {
    return data.sort((...items) => {
      const first = type === 'asc' ? items[0] : items[1];
      const second = type === 'asc' ? items[1] : items[0];

      if (!first[byField] || !second[byField]) {
        return false;
      }

      return new Date(first[byField]) - new Date(second[byField]);
    });
  };

  static getFormattedDate = (source = '') => {
    if (!source) {
      return '';
    }

    return moment(source).format(DATE_FORMAT);
  };

  static getFormattedDynamicType = (source = {}) => {
    const target = {};

    if (!Object.keys(source).length) {
      return target;
    }

    const canUpload = get(source, 'canUpload');

    target.type = get(source, 'id', '');
    target.name = get(source, 'name', t('documents-widget.untitled'));
    target.formId = get(source, 'formId', '');
    target.multiple = get(source, 'multiple', false);
    target.mandatory = get(source, 'mandatory', false);
    target.countDocuments = get(source, 'countDocuments', 0);
    target.locked = get(source, 'locked', false);
    target.canUpload = !isExistValue(canUpload) || canUpload;
    target.journalId = get(source, 'journalId', '');

    return target;
  };

  static getTypesForConfig = (source = [], configTypes = []) => {
    if (!source.length) {
      return [];
    }

    return lodashClone(source).map((item = {}) => {
      if (!Object.keys(item).length) {
        return {};
      }

      const type = configTypes.find(type => type.type === item.type);
      const target = { ...type };
      const canUpload = get(item, 'canUpload');

      if (!isEmpty(item.customizedColumns)) {
        target.columns = item.customizedColumns.map(column => ({
          attribute: get(column, 'attribute', ''),
          visible: get(column, 'visible'),
          name: get(column, 'name', '')
        }));
      }

      target.type = get(item, 'type', '');
      target.multiple = get(item, 'multiple', false);
      target.mandatory = get(item, 'mandatory', false);
      target.canUpload = !isExistValue(canUpload) || canUpload;
      target.journalId = get(item, 'journalId', '');

      return target;
    });
  };

  static combineTypes = (baseTypes = [], userTypes = []) => {
    const base = deepClone(baseTypes, []);
    const user = deepClone(userTypes, []);

    return user.reduce((result, current) => {
      const index = result.findIndex(item => item.type === current.type);

      current.formId = null;

      if (~index) {
        if (result[index].multiple !== current.multiple) {
          current.multiple = result[index].multiple;
          result[index] = current;
        }

        if (result[index].mandatory !== current.mandatory) {
          current.mandatory = result[index].mandatory;
          result[index] = current;
        }

        if (result[index].canUpload !== current.canUpload) {
          current.canUpload = result[index].canUpload;
          result[index] = current;
        }

        return result;
      }

      result.push(current);

      return result;
    }, base);
  };

  static getDataToCreate = data => ({
    recordRef: get(data, 'createVariants.recordRef') || DEFAULT_REF,
    formId: get(data, 'createVariants.formRef') || data.formId || '',
    attributes: DocumentsConverter.getUploadAttributes(data)
  });

  static getUploadAttributes = (source = {}) => {
    if (!Object.keys(source).length) {
      return {};
    }

    const target = {};
    const createVariants = get(source, 'createVariants', {});

    target._parentAtt = get(createVariants, 'attributes._parentAtt', 'icase:documents');
    target._parent = source.record;

    if (source._etype || source.type) {
      target._etype = source._etype || source.type;
    }

    if (source._content || source.content) {
      target._content = source._content || source.content;
    }

    return target;
  };

  static getAddNewVersionFormDataForServer(source = {}) {
    const target = new FormData();

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.append('filedata', get(source, 'file', ''));
    target.append('filename', get(source, 'file.name', t('documents-widget.untitled')));
    target.append('updateNodeRef', get(source, 'record', ''));
    target.append('description', get(source, 'comment', ''));
    target.append('majorversion', get(source, 'isMajor', true));
    target.append('overwrite', 'true');

    return target;
  }

  static getColumnsAttributes(source = []) {
    if (isEmpty(source)) {
      return '';
    }

    if (!Array.isArray(source)) {
      return '';
    }

    return source
      .map(column => {
        let { name, schema, attribute, dataField } = column;
        const alias = dataField || attribute || name;

        console.warn({ alias });

        if (attribute && schema) {
          if (schema.charAt(0) === '.') {
            return `${alias}:${schema.slice(1)}`;
          }

          // if (alias.includes(':')) {
          //   return `${alias.replace(':', '_')}:att(n:"${schema}"){disp}`;
          // }

          return `${alias}:att(n:"${schema}"){disp}`;
        }

        if (!attribute && !name) {
          return '';
        }

        if (!attribute) {
          return `${alias}:att(n:"${name}"){disp}`;
        }

        if (attribute.charAt(0) === '.') {
          return `${alias}:${attribute.slice(1)}`;
        }

        if (name) {
          if (attribute.includes('att(n:')) {
            return `${alias}:${attribute}`;
          }

          return `${alias}:att(n:"${attribute}"){disp}`;
        }

        return attribute || name;
      })
      .filter(item => !!item)
      .join(',');
  }

  static getColumnForWeb(source = []) {
    if (isEmpty(source)) {
      return [];
    }

    if (!Array.isArray(source)) {
      return [];
    }

    return source.map(item => {
      return {
        ...item,
        dataField: DocumentsConverter.getAttribute(item.schema || item.attribute, item.name || item.attribute),
        text: getTextByLocale(item.label || item.text)
      };
    });
  }

  static prepareAttrName(name) {
    return name.replace(/[-,:]/g, '_');
  }

  static getAttribute(attr = '', name = '') {
    const alias = DocumentsConverter.prepareAttrName(name);

    if (name) {
      return alias;
    }

    if (attr.charAt(0) === '.') {
      return alias;
    }

    if (attr.includes(':')) {
      return alias;
    }

    if (attr.includes('-')) {
      return attr.toLowerCase().replace(/-/g, '_');
    }

    return attr || alias;
  }

  static getColumnsForSettings(columns = [], configColumns = []) {
    if (isEmpty(columns)) {
      return [];
    }

    const customizedColumns = deepClone(configColumns);
    let originColumns = deepClone(columns);

    originColumns = originColumns.map(column => ({
      attribute: column.attribute,
      name: column.name,
      label: getTextByLocale(column.label),
      visible: column.visible === undefined ? true : column.visible
    }));

    if (isEmpty(customizedColumns)) {
      return originColumns;
    }

    const result = customizedColumns.map(item => {
      const index = originColumns.findIndex(origin => DocumentsConverter.filterColumn(origin, item));

      if (!~index) {
        return item;
      }

      const [deleted] = originColumns.splice(index, 1, {});

      return {
        visible: deleted.visible,
        ...item,
        label: getTextByLocale(deleted.label)
      };
    });

    return [
      ...result,
      ...originColumns
        .filter(i => !isEmpty(i))
        .map(i => ({
          attribute: i.attribute,
          visible: i.visible,
          name: i.name,
          label: getTextByLocale(i.label)
        }))
    ];
  }

  static filterColumn = (origin, custom) => {
    if (origin.attribute) {
      if (origin.name) {
        return origin.attribute === custom.attribute && origin.name === custom.name;
      }

      return origin.attribute === custom.attribute;
    }

    return origin.name === custom.name;
  };

  static getColumnsForGrid(columns = [], configColumns = []) {
    if (isEmpty(columns)) {
      return [];
    }

    const customizedColumns = lodashClone(configColumns);
    const originColumns = lodashClone(columns);

    if (isEmpty(customizedColumns)) {
      return originColumns;
    }

    const result = customizedColumns.map(item => {
      const index = originColumns.findIndex(origin => DocumentsConverter.filterColumn(origin, item));

      if (!~index) {
        return item;
      }

      const [deleted] = originColumns.splice(index, 1, {});

      return {
        ...deleted,
        ...item,
        label: getTextByLocale(deleted.label)
      };
    });

    return [...result, ...originColumns.filter(item => !isEmpty(item))].map(item => ({ ...item, hidden: !item.visible }));
  }

  static getColumnsConfig(config) {
    if (config === null) {
      return null;
    }

    const target = { ...config };

    target.columns = get(config, 'columns', []).map(column => ({
      ...column,
      label: t(getTextByLocale(column.label || ''))
    }));
    target.label = getTextByLocale(config.label);

    return target;
  }

  static setDefaultFormatters(columns) {
    for (let key in fieldFormatters) {
      const info = fieldFormatters[key];
      const findIndex = columns.findIndex(col => col.schema && col.schema.includes(info.schema));

      if (findIndex >= 0 && !columns[findIndex].formatter) {
        columns[findIndex].formatter = info.formatter;
      }
    }
  }
}
