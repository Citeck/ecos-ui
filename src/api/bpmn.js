import { RecordService } from './recordService';
import { ROOT_CATEGORY_NODE_REF } from '../constants/bpmn';
import Records from '../components/Records';

export class BpmnApi extends RecordService {
  fetchCategories = () => {
    //todo: replace to using Records.js
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
        modified: '_modified',
        canWrite: '.att(n:"permissions"){has(n:"Write")}'
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
    let rec = Records.get('alfresco/@');
    rec.att('_parent', parent);
    rec.att('type', 'cm:category');
    rec.att('cm:title', title);
    return rec.save();
  };

  updateCategory = (id, { title }) => {
    const attributes = {};

    if (title) {
      attributes['cm:title'] = title;
    }

    //todo: replace to using Records.js
    return this.mutate({
      record: {
        id,
        attributes
      }
    });
  };

  deleteCategory = id => {
    //todo: replace to using Records.js
    return this.delete({
      record: id
    });
  };

  fetchProcessModels = () => {
    return this.query({
      query: {
        query: 'TYPE:"ecosbpm:processModel"',
        language: 'fts-alfresco',
        sortBy: [{ attribute: 'ecosbpm:index', ascending: true }],
        consistency: 'TRANSACTIONAL'
      },
      attributes: {
        index: 'ecosbpm:index',
        label: 'cm:title',
        description: 'cm:description',
        created: 'cm:created',
        creator: 'cm:creator',
        categoryId: 'ecosbpm:category?id',
        modifier: '_modifier',
        modified: '_modified',
        hasThumbnail: '.has(n:"ecosbpm:thumbnail")',
        canWrite: '.att(n:"permissions"){has(n:"Write")}'
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
      type: 'ecosbpm:processModel',
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

    //todo: replace to using Records.js
    return this.mutate({
      record: {
        attributes
      }
    });
  };

  importProcessModel = data => {
    const { content, categoryId, author, owner, reviewers, validFrom, validTo } = data;

    const attributes = {
      type: 'ecosbpm:processModel',
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

    //todo: replace to using Records.js
    return this.mutate({
      record: {
        attributes
      }
    });
  };

  deleteProcessModel = id => {
    //todo: replace to using Records.js
    return this.delete({
      record: id
    });
  };
}
