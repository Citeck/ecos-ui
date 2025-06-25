import isArray from 'lodash/isArray';

import Records from '../components/Records';
import { SourcesId } from '../constants';

const LEGACY_FIELDS = {
  text: 'text',
  createdAt: 'createdAt',
  modifiedAt: 'modifiedAt',
  author: 'author?json',
  editor: 'editor?json',
  permissions: 'permissions?json',
  edited: 'edited',
  tags: 'tags[]{type,name}'
};

const EMODEL_FIELDS = {
  text: 'text',
  createdAt: '_created',
  modifiedAt: '_modified',
  author: '_creator{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,avatarUrl:avatar.url}',
  editor: '_modifier{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName}',
  canEdit: 'permissions._has.Write?bool',
  edited: 'edited!false',
  tags: 'tags[]{type,name}'
};

const isNodeRef = record => record.indexOf('workspace://SpacesStore/') !== -1;

export class CommentsApi {
  getAll = record => {
    return this.getByPage({ record, skipCount: 0, maxItems: 1000 });
  };

  getByPage = ({ record, skipCount = 0, maxItems = 10 }) => {
    if (isNodeRef(record)) {
      return Records.query(
        {
          query: { record },
          page: {
            skipCount,
            maxItems
          },
          sourceId: SourcesId.LEGACY_COMMENT
        },
        LEGACY_FIELDS
      );
    } else {
      return Records.query(
        {
          query: { t: 'eq', a: 'record', v: record },
          language: 'predicate',
          page: {
            skipCount,
            maxItems
          },
          sortBy: [{ attribute: '_created', ascending: false }],
          sourceId: SourcesId.EMODEL_COMMENT
        },
        EMODEL_FIELDS
      );
    }
  };

  getCommentById = id => {
    let fields = EMODEL_FIELDS;
    if (id.indexOf('emodel') === -1) {
      fields = LEGACY_FIELDS;
    }
    return Records.get(id)
      .load(fields)
      .then(response => response);
  };

  create = ({ text, record, isInternal, docsRefs = [] } = {}) => {
    if (isNodeRef(record)) {
      const comment = Records.get('comment@');

      comment.att('text', text);
      comment.att('record', record);

      return comment.save();
    } else {
      const comment = Records.getRecordToEdit('emodel/comment@');

      comment.att('text', text);
      comment.att('record', record);

      if (isArray(docsRefs) && docsRefs.length > 0) {
        comment.att('att_add_docs:documents', docsRefs);
      }

      if (isInternal) {
        comment.att('tags', [{ type: 'INTERNAL', name: {} }]);
      }

      return comment.save();
    }
  };

  update = ({ id, text } = {}) => {
    const comment = Records.getRecordToEdit(id);

    comment.att('text', text);

    return comment.save();
  };

  delete = id => {
    const ids = Array.isArray(id) ? id : [id];

    return Records.remove(ids);
  };
}
