import Records from '../components/Records';
import { PERMISSION_WRITE_ATTR } from '../components/Records/constants';
import {
  PERMISSION_DMN_SECTION_CREATE_DEF,
  PERMISSION_DMN_SECTION_EDIT_DEF,
  PERMISSION_DMN_SECTION_CREATE_SUBSECTION
} from '../constants/dmn';

export class DmnApi {
  static DMN_SECTION_ATTRS = {
    id: '?id',
    code: 'sectionCode?str',
    label: 'name?json',
    parentId: 'parentRef?id',
    modified: '_created?num',
    canWrite: PERMISSION_WRITE_ATTR,
    canCreateDef: PERMISSION_DMN_SECTION_CREATE_DEF,
    canEditDef: PERMISSION_DMN_SECTION_EDIT_DEF,
    canCreateSubSection: PERMISSION_DMN_SECTION_CREATE_SUBSECTION
  };

  fetchCategories = () => {
    return Records.query(
      {
        sourceId: 'eproc/dmn-section',
        language: 'predicate',
        query: {}
      },
      DmnApi.DMN_SECTION_ATTRS
    ).then(resp => {
      return resp.records;
    });
  };

  createCategory = (code = '', title, parent = null) => {
    const rec = Records.get('eproc/dmn-section@');
    rec.att('parentRef', parent);
    rec.att('name', title);
    rec.att('sectionCode', code);
    return rec.save(DmnApi.DMN_SECTION_ATTRS);
  };

  updateCategory = (id, { code = '', title }) => {
    if (title) {
      const rec = Records.get(id);
      rec.att('name', title);
      rec.att('sectionCode', code);
      return rec.save(DmnApi.DMN_SECTION_ATTRS);
    }
  };

  deleteCategory = id => {
    return Records.remove([id]);
  };

  fetchCreateVariants = () => {
    return Records.get('emodel/type@dmn-def').load('createVariants[]?json');
  };

  fetchProcessModels = () => {
    return Records.query(
      {
        sourceId: 'eproc/dmn-def',
        language: 'predicate',
        workspaces: ['default'],
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
        categoryId: 'sectionRef?id!"eproc/dmn-section@DEFAULT"',
        modifier: '_modifier',
        modified: '_modified?num',
        previewUrl: 'preview.url',
        hasThumbnail: '_has.thumbnail?bool!false',
        canWrite: PERMISSION_WRITE_ATTR
      }
    ).then(resp => {
      return resp.records;
    });
  };

  importProcessModel = data => {
    const { content, categoryId, author, owner, reviewers, validFrom, validTo } = data;

    const attributes = {
      type: 'ecosdmn:processModel',
      'cm:content': content,
      'ecosdmn:category': categoryId,
      'ecosdmn:processAuthorAssoc': author,
      'ecosdmn:processOwnerAssoc': owner
    };

    if (reviewers) {
      attributes['ecosdmn:processReviewerAssoc'] = reviewers;
    }

    if (validFrom) {
      attributes['ecosdmn:validFrom'] = validFrom;
    }

    if (validTo) {
      attributes['ecosdmn:validTo'] = validTo;
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
