import moment from 'moment';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { deepClone, t } from '../helpers/util';
import { DATE_FORMAT, DEFAULT_REF, NULL_FORM } from '../constants/documents';

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

      return {
        ...item,
        locked: get(item, 'locked', locked),
        formId: DocumentsConverter.formIdIsNull(item.formId) ? null : item.formId,
        name: item.name || get(typeNames, [item.type], t('documents-widget.untitled')),
        countDocuments: documents.length,
        lastDocumentRef: get(document, 'id', ''),
        loadedBy: get(document, 'loadedBy', ''),
        canDropUpload: !createVariants.formRef,
        modified: DocumentsConverter.getFormattedDate(get(document, 'modified', ''))
      };
    });
  };

  static getDynamicType = (source = {}) => {
    const target = {};

    if (!Object.keys(source).length) {
      return target;
    }

    target.formId = DocumentsConverter.formIdIsNull(source.formId) ? null : source.formId;
    target.multiple = get(source, 'multiple', false);
    target.mandatory = get(source, 'mandatory', false);
    target.type = get(source, 'type', '');
    target.name = get(source, 'name', t('documents-widget.untitled'));
    target.countDocuments = get(source, 'countDocuments', 0);
    target.locked = get(source, 'locked', false);

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

    target.type = get(source, 'id', '');
    target.name = get(source, 'name', t('documents-widget.untitled'));
    target.formId = get(source, 'formId', '');
    target.multiple = get(source, 'multiple', false);
    target.mandatory = get(source, 'mandatory', false);
    target.countDocuments = get(source, 'countDocuments', 0);
    target.locked = get(source, 'locked', false);

    return target;
  };

  static getTypesForConfig = (source = []) => {
    if (!source.length) {
      return [];
    }

    return deepClone(source).map((item = {}) => {
      if (!Object.keys(item).length) {
        return {};
      }

      const target = {};

      target.type = get(item, 'type', '');
      target.multiple = get(item, 'multiple', false);
      target.mandatory = get(item, 'mandatory', false);

      return target;
    });
  };

  static combineTypes = (baseTypes = [], userTypes = []) => {
    const base = deepClone(baseTypes);
    const user = deepClone(userTypes);

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
        const { name } = column;
        let attribute = column.attribute || '';

        if (!attribute && !name) {
          return '';
        }

        if (!attribute) {
          return `${name}:att(n:"${name}"){disp}`;
        }

        // if (!attribute) {
        //   if (name.includes('att(n:')) {
        //     return name;
        //   }
        //
        //   if (name.charAt(0) === '.') {
        //     return `${name}:${name.slice(1)}`;
        //   }
        //
        //   return `${name}:att(n:"${name}"){disp}`;
        // }

        if (attribute.charAt(0) === '.') {
          return `${name}:${attribute.slice(1)}`;
        }

        if (name) {
          if (attribute.includes('att(n:')) {
            return `${name}:${attribute}`;
          }

          return `${name}:att(n:"${attribute}"){disp}`;
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
        dataField: DocumentsConverter.getAttribute(item.attribute, item.name),
        text: item.label
      };
    });
  }

  static getAttribute(attr = '', name = '') {
    if (name) {
      return name;
    }

    if (attr.charAt(0) === '.') {
      return name;
    }

    if (attr.includes(':')) {
      return name;
    }

    if (attr.includes('-')) {
      return attr.toLowerCase().replace(/-/g, '_');
    }

    return attr || name;
  }
}
