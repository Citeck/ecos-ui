import moment from 'moment';
import get from 'lodash/get';
import { deepClone } from '../helpers/util';

export default class DocumentsConverter {
  static getDynamicTypes = (types = [], typeNames = {}, countByTypes = []) => {
    if (!types.length || !Object.keys(typeNames).length) {
      return types;
    }

    return types.map((item, index) => ({
      ...item,
      name: typeNames[item.type],
      countDocuments: countByTypes[index].length
    }));
  };

  static getDocuments = ({ documents, type, typeName }) => {
    return documents.map(document => {
      const target = {};

      if (!document || !Object.keys(document)) {
        return target;
      }

      target.id = document.id;
      target.type = type;
      target.typeName = typeName;
      target.loadedBy = document.loadedBy;
      target.modified = moment(document.modified).format('DD.MM.YYYY HH:mm');

      return target;
    });
  };

  static getAvailableTypes = (availavleTypes = [], dynamicTypeKeys = []) =>
    availavleTypes.map(item => ({
      ...item,
      isSelected: dynamicTypeKeys.includes(item.id)
    }));

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
    recordRef: '',
    formId,
    attributes: {
      _parent: record,
      _parentAtt: 'icase:documents',
      _etype: type
    }
  });
}
