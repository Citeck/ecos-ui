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

    return types.map((item, index) => {
      const documents = get(countByTypes, [index], []);
      let document = {};

      if (documents.length) {
        document = documents[documents.length - 1];
      }

      return {
        ...item,
        formId: DocumentsConverter.formIdIsNull(item.formId) ? null : item.formId,
        name: item.name || get(typeNames, [item.type], ''),
        countDocuments: documents.length,
        loadedBy: get(document, '_modifier', ''),
        modified: DocumentsConverter.getFormattedDate(get(document, '_modified', ''))
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
      target.modified = DocumentsConverter.getFormattedDate(document.modified);

      return target;
    });
  };

  static getFormattedDate = (source = '') => {
    if (!source) {
      return '';
    }

    return moment(source).format('DD.MM.YYYY HH:mm');
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

    return deepClone(source).map((item = {}) => {
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

  static getDataToCreate = data => ({
    recordRef: 'dict@cm:content',
    formId: get(data, 'formId', ''),
    attributes: {
      _parent: get(data, 'record', ''),
      _parentAtt: 'icase:documents',
      _etype: get(data, 'type', ''),
      _content: get(data, 'files', []).map(file => {
        file.label = file.name;

        return {
          size: file.size,
          name: file.name
        };
      })
    }
  });

  static getAddNewVersionFormDataForServer(source = {}) {
    const target = new FormData();

    if (!source || (source && !Object.keys(source))) {
      return target;
    }

    target.append('filedata', get(source, 'file', ''));
    target.append('filename', get(source, 'file.name', ''));
    target.append('updateNodeRef', get(source, 'record', ''));
    target.append('description', get(source, 'comment', ''));
    target.append('majorversion', get(source, 'isMajor', true));
    target.append('overwrite', 'true');

    return target;
  }
}
