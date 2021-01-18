import Records from '../components/Records';
import { SourcesId } from '../constants';

export class CommentsApi {
  getAll = record => {
    return Records.query(
      {
        query: {
          record
        },
        sourceId: SourcesId.COMMENT
      },
      {
        text: 'text',
        createdAt: 'createdAt',
        modifiedAt: 'modifiedAt',
        author: 'author?json',
        editor: 'editor?json',
        permissions: 'permissions?json',
        edited: 'edited'
      }
    ).then(response => response);
  };

  getByPage = ({ record, skipCount = 0, maxItems = 10 }) => {
    return Records.query(
      {
        query: {
          record
        },
        page: {
          skipCount,
          maxItems
        },
        sourceId: SourcesId.COMMENT
      },
      {
        text: 'text',
        createdAt: 'createdAt',
        modifiedAt: 'modifiedAt',
        author: 'author?json',
        editor: 'editor?json',
        permissions: 'permissions?json',
        edited: 'edited',
        tags: 'tags[].name'
      }
    ).then(response => response);
  };

  getCommentById = id => {
    return Records.get(id)
      .load({
        text: 'text',
        createdAt: 'createdAt',
        modifiedAt: 'modifiedAt',
        author: 'author?json',
        editor: 'editor?json',
        permissions: 'permissions?json',
        edited: 'edited'
      })
      .then(response => response);
  };

  create = ({ text, record } = {}) => {
    const comment = Records.get('comment@');

    comment.att('text', text);
    comment.att('record', record);

    return comment.save().then(response => response);
  };

  update = ({ id, text } = {}) => {
    const comment = Records.get(id);

    comment.att('text', text);

    return comment.save().then(response => response);
  };

  delete = id => {
    const ids = Array.isArray(id) ? id : [id];

    return Records.remove(ids).then(response => response);
  };
}
