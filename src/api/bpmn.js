import { RecordService } from './recordService';
import { ROOT_CATEGORY_NODE_REF } from '../constants/bpmn';

export class BpmnApi extends RecordService {
  fetchCategories = () => {
    return this.query({
      query: {
        query: {
          parent: ROOT_CATEGORY_NODE_REF,
          assocName: 'cm:subcategories',
          recursive: true
        },
        language: 'children'
      },
      attributes: {
        label: 'cm:title',
        parentId: 'attr:parent?id'
      }
    }).then(resp => {
      return resp.records.map(item => {
        return {
          id: item.id,
          ...item.attributes
        };
      });
    });
  };

  createCategory = (title, parent = ROOT_CATEGORY_NODE_REF) => {
    return this.mutate({
      record: {
        parent: parent,
        type: 'cm:category',
        attributes: {
          'cm:title': title
        }
      }
    });
  };

  updateCategory = (id, { title }) => {
    const attributes = {};

    if (title) {
      attributes['cm:title'] = title;
    }

    return this.mutate({
      record: {
        id,
        attributes
      }
    });
  };

  deleteCategory = id => {
    return this.delete({
      record: id
    });
  };

  fetchProcessModels = () => {
    return this.query({
      query: {
        query: 'TYPE:"ecosbpm:processModel"',
        language: 'fts-alfresco',
        sortBy: [{ attribute: 'ecosbpm:index', ascending: true }]
      },
      attributes: {
        label: 'cm:title',
        description: 'cm:description',
        created: 'cm:created',
        creator: 'cm:creator',
        categoryId: 'ecosbpm:category?id'
      }
    }).then(resp => {
      return resp.records.map(item => {
        return {
          id: item.id,
          ...item.attributes
        };
      });
    });
  };

  createProcessModel = ({ title, description, categoryId }) => {
    return this.mutate({
      record: {
        type: 'ecosbpm:processModel',
        attributes: {
          'cm:title': title,
          'cm:description': description,
          'ecosbpm:category': categoryId
        }
      }
    });
  };

  deleteProcessModel = id => {
    return this.delete({
      record: id
    });
  };
}
