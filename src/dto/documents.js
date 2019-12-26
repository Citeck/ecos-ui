export default class DocumentsConverter {
  static getDynamicTypes = (types = [], typeNames = {}) => {
    if (!types.length || !Object.keys(typeNames).length) {
      return types;
    }

    return types.map(item => ({
      ...item,
      name: typeNames[item.type]
    }));
  };

  static getDocuments = (recordRefs = [], types = []) => {
    return recordRefs.map((documents, index) => ({
      type: types[index],
      documents
    }));
  };
}
