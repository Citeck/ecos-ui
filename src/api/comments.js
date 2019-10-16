import { RecordService } from './recordService';
import { SourcesId } from '../constants';

export class CommentsApi extends RecordService {
  getAll = record => {
    return window.Citeck.Records.query(
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
    return window.Citeck.Records.query(
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
        edited: 'edited'
      }
    ).then(response => response);
  };

  getCommentById = id => {
    return window.Citeck.Records.get(id)
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
    const comment = window.Citeck.Records.get('comment@');

    comment.att('text', text);
    comment.att('record', record);

    return comment.save().then(response => response);
  };

  update = ({ id, text } = {}) => {
    const comment = window.Citeck.Records.get(id);

    comment.att('text', text);

    return comment.save().then(response => response);
  };

  delete = id => {
    return window.Citeck.Records.remove([id]).then(response => response);
  };
}
