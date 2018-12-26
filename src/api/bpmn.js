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
}
