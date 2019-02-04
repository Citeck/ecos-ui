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
        parentId: 'attr:parent?id',
        modified: 'cm:modified'
      }
    }).then(resp => {
      return resp.records.map(item => {
        return {
          id: item.id,
          ...item.attributes,
          modified: new Date(item.attributes.modified).getTime()
        };
      });
    });
  };

  createCategory = (title, parent = ROOT_CATEGORY_NODE_REF) => {
    return this.mutate({
      record: {
        attributes: {
          _parent: parent,
          _type: 'cm:category',
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
        index: 'ecosbpm:index',
        label: 'cm:title',
        description: 'cm:description',
        created: 'cm:created',
        creator: 'cm:creator',
        categoryId: 'ecosbpm:category?id',
        modifier: 'cm:modifier',
        modified: 'cm:modified',
        hasThumbnail: '.has(n:"ecosbpm:thumbnail")'
      }
    }).then(resp => {
      return resp.records.map(item => {
        // const created = (new Date(item.attributes.created)).getTime();
        return {
          id: item.id,
          ...item.attributes,
          label: item.attributes.label || ''
          // created,
        };
      });
    });
  };

  createProcessModel = data => {
    const { title, processKey, description, categoryId, author, owner, reviewers, validFrom, validTo } = data;
    // console.log(data);
    const attributes = {
      _type: 'ecosbpm:processModel',
      'ecosbpm:processId': processKey,
      'cm:title': title,
      'cm:description': description,
      'ecosbpm:category': categoryId,
      'ecosbpm:processAuthorAssoc': author,
      'ecosbpm:processOwnerAssoc': owner
    };

    if (reviewers) {
      attributes['ecosbpm:processReviewerAssoc'] = reviewers;
    }

    if (validFrom) {
      attributes['ecosbpm:validFrom'] = validFrom;
    }

    if (validTo) {
      attributes['ecosbpm:validTo'] = validTo;
    }

    return this.mutate({
      record: {
        attributes
      }
    });
  };

  importProcessModel = data => {
    const { content, categoryId, author, owner, reviewers, validFrom, validTo } = data;

    const attributes = {
      _type: 'ecosbpm:processModel',
      'cm:content': content,
      'ecosbpm:category': categoryId,
      'ecosbpm:processAuthorAssoc': author,
      'ecosbpm:processOwnerAssoc': owner
    };

    if (reviewers) {
      attributes['ecosbpm:processReviewerAssoc'] = reviewers;
    }

    if (validFrom) {
      attributes['ecosbpm:validFrom'] = validFrom;
    }

    if (validTo) {
      attributes['ecosbpm:validTo'] = validTo;
    }

    return this.mutate({
      record: {
        attributes
      }
    });
  };

  deleteProcessModel = id => {
    return this.delete({
      record: id
    });
  };
}
