import { RecordService } from './recordService';
import Records from '../components/Records';
import { PERMISSION_WRITE_ATTR } from '../components/Records/constants';

export class BpmnApi extends RecordService {
  fetchCategories = () => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-section',
        language: 'predicate',
        query: {}
      },
      {
        label: 'name',
        parentId: 'parentRef?id',
        modified: '_created?num',
        canWrite: PERMISSION_WRITE_ATTR
      }
    ).then(resp => {
      return resp.records;
    });
  };

  createCategory = (title, parent = null) => {
    const rec = Records.get('eproc/bpmn-section@');
    rec.att('parentRef', parent);
    rec.att('name', title);
    return rec.save();
  };

  updateCategory = (id, { title }) => {
    if (title) {
      const rec = Records.get(id);
      rec.att('name', title);
      return rec.save();
    }
  };

  deleteCategory = id => {
    return Records.remove([id]);
  };

  fetchCreateVariants = () => {
    return Records.get('emodel/type@bpmn-process-def').load('createVariants[]?json');
  };

  fetchProcessModels = () => {
    return Records.query(
      {
        sourceId: 'eproc/bpmn-def',
        language: 'predicate',
        query: {},
        page: { maxItems: 10000 }
      },
      {
        ref: '?id',
        index: 'index',
        label: '?disp!""',
        description: 'description',
        created: '_created?num',
        creator: '_creator',
        categoryId: 'sectionRef?id!"eproc/bpmn-section@DEFAULT"',
        modifier: '_modifier',
        modified: '_modified?num',
        previewUrl: 'preview.url',
        hasThumbnail: '_has.thumbnail?bool!false',
        definition: 'definition?str',
        canWrite: PERMISSION_WRITE_ATTR
      }
    ).then(resp => {
      return resp.records;
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
    return Records.remove([id]);
  };
}
