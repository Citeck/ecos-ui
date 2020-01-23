import moment from 'moment';
import get from 'lodash/get';
import { deepClone } from '../helpers/util';

export default class DocumentsConverter {
  static formIdIsNull = (id = '') => {
    let isNull = false;

    if (!id) {
      isNull = true;
    }

    if (id === 'uiserv/eform@null') {
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
      formId: DocumentsConverter.formIdIsNull(type.formId) ? null : type.formId
    }));
  };

  static getDynamicTypes = ({ types = [], typeNames = {}, countByTypes = [] }) => {
    if (!types.length) {
      return types;
    }

    return types.map((item, index) => ({
      ...item,
      formId: DocumentsConverter.formIdIsNull(item.formId) ? null : item.formId,
      name: item.name || get(typeNames, [item.type], ''),
      countDocuments: get(countByTypes, [index], []).length
    }));
  };

  static getDynamicType = (source = {}) => {
    const target = {};

    if (!Object.keys(source).length) {
      return target;
    }

    console.warn(source);

    target.formId = DocumentsConverter.formIdIsNull(source.formId) ? null : source.formId;
    target.multiple = get(source, 'multiple', false);
    target.mandatory = get(source, 'mandatory', false);
    target.type = get(source, 'type', '');
    target.name = get(source, 'name', '');
    target.countDocuments = get(source, 'countDocuments', 0);

    return target;
  };

  static getDocuments = ({ documents, type, typeName }) => {
    return documents.map(document => {
      const target = {};

      if (!document || !Object.keys(document)) {
        return target;
      }

      target.id = document.id;
      target.type = type;
      target.name = document.name;
      target.typeName = typeName;
      target.loadedBy = document.loadedBy;
      target.modified = moment(document.modified).format('DD.MM.YYYY HH:mm');

      return target;
    });
  };

  static getFormattedDynamicType = (source = {}) => {
    const target = {};

    if (!Object.keys(source).length) {
      return target;
    }

    target.type = get(source, 'id', '');
    target.name = get(source, 'name', '');
    target.formId = get(source, 'formId', '');
    target.multiple = get(source, 'multiple', false);
    target.mandatory = get(source, 'mandatory', false);
    target.countDocuments = get(source, 'countDocuments', 0);

    return target;
  };

  static getTypesForConfig = (source = []) => {
    if (!source.length) {
      return [];
    }

    return source.map((item = {}) => {
      if (!Object.keys(item).length) {
        return {};
      }

      const target = {};

      target.type = get(item, 'type', '');
      target.formId = get(item, 'formId', '');
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

      if (~index) {
        if (result[index].multiple !== current.multiple) {
          current.multiple = result[index].multiple;
          result[index] = current;
        }

        return result;
      }

      result.push(current);

      return result;
    }, base);
  };

  static getDataToCreate = ({ type, record, formId }) => ({
    recordRef: 'dict@cm:content',
    formId,
    attributes: {
      _parent: record,
      _parentAtt: 'icase:documents',
      _etype: type
    }
  });
}
