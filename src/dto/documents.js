import moment from 'moment';

export default class DocumentsConverter {
  static getDynamicTypes = (types = [], typeNames = {}, countByTypes = []) => {
    if (!types.length || !Object.keys(typeNames).length) {
      return types;
    }

    return types.map((item, index) => ({
      ...item,
      name: typeNames[item.type],
      count: countByTypes[index].length
    }));
  };

  static getDocuments = documents => {
    return documents.map(document => {
      const target = {};

      if (!document || !Object.keys(document)) {
        return target;
      }

      target.id = document.id;
      target.loadedBy = document.loadedBy;
      target.modified = moment(document.modified).format('DD.MM.YYYY HH:mm');

      return target;
    });
  };
}
