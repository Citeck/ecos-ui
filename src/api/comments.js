import { RecordService } from './recordService';

export class CommentsApi extends RecordService {
  getAll = record => {
    return window.Citeck.Records.query(
      {
        query: {
          record
        },
        sourceId: 'comment'
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
    ).then(resp => resp);
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
        sourceId: 'comment'
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
    ).then(resp => resp);
  };

  create = ({ text, record } = {}) => {
    const comment = window.Citeck.Records.get('comment@');

    comment.att('text', text);
    comment.att('record', record);

    return comment.save().then(resp => resp);
  };

  update = ({ id, text } = {}) => {
    const comment = window.Citeck.Records.get(id);

    comment.att('text', text);

    return comment.save().then(resp => resp);
  };

  delete = id => {
    return window.Citeck.Records.remove([id]).then(resp => resp);
  };
}
