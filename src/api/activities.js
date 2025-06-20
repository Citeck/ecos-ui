import get from 'lodash/get';
import isArray from 'lodash/isArray';

import Records from '../components/Records';
import { SourcesId } from '../constants';
import { ActivityTypes } from '../constants/activity';
import { getWorkspaceId } from '../helpers/urls';

const EMODEL_FIELDS = {
  title: 'title',
  topic: 'topic',
  text: 'text',
  createdAt: '_created',
  modifiedAt: '_modified',
  status: '_status{id,displayName:?disp}',
  activityDate: 'activityDate',
  activityDuration: 'activityDuration',
  result: 'result',
  priority: 'priority',
  dueDate: 'dueDate',
  commentActivity: 'comment',
  assignment: 'assignment?id',
  type: '_type{id,displayName:?disp}',
  participants: 'participants[]{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,avatarUrl:avatar.url}',
  performer: 'performer{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,middleName,avatarUrl:avatar.url}',
  initiator: 'initiator{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,avatarUrl:avatar.url}',
  responsible: 'responsible{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,middleName,avatarUrl:avatar.url}',
  author: '_creator{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,avatarUrl:avatar.url}',
  editor: '_modifier{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName}',
  canEdit: 'permissions._has.Write?bool',
  edited: 'edited!false',
  tags: 'tags[]{type,name}'
};

export class ActivitiesApi {
  getTypes = () => {
    return Records.query({ sourceId: SourcesId.EMODEL_ACTIVITY });
  };

  getAll = record => {
    return this.getByPage({ record, skipCount: 0, maxItems: 1000 });
  };

  getByPage = ({ record, skipCount = 0, maxItems = 10 }) => {
    return Records.query(
      {
        query: { t: 'eq', att: '_parent', val: record || `emodel/workspace@${getWorkspaceId()}` },
        language: 'predicate',
        page: {
          skipCount,
          maxItems
        },
        sortBy: [{ attribute: '_created', ascending: false }],
        sourceId: SourcesId.EMODEL_ACTIVITY
      },
      EMODEL_FIELDS
    );
  };

  getActivityById = id => {
    return Records.get(id)
      .load(EMODEL_FIELDS)
      .then(response => response);
  };

  create = ({ text, record, isInternal, selectedType, docsRefs = [], ...rest } = {}) => {
    const comment = Records.getRecordToEdit(`${SourcesId.EMODEL_ACTIVITY}@`);

    comment.att('text', text);
    comment.att('_type', selectedType.id);
    comment.att('_parent', record || `emodel/workspace@${getWorkspaceId()}`);
    comment.att('_parentAtt', 'has-ecos-activities:ecosActivities');

    if (isArray(docsRefs) && docsRefs.length > 0) {
      comment.att('att_add_docs:documents', docsRefs);
    }

    switch (selectedType.id) {
      case ActivityTypes.MEETING:
      case ActivityTypes.CALL:
      case ActivityTypes.EMAIL:
        comment.att('activityDate', rest.activityDate);
        comment.att('responsible', rest.responsible);
        comment.att('topic', rest.topic);
        if (get(rest, 'activityDuration.id')) {
          comment.att('activityDuration', rest.activityDuration.id);
        }
        if (get(rest, 'participants') && isArray(rest.participants) && rest.participants.length > 0) {
          comment.att('participants', rest.participants || []);
        }
        break;
      case ActivityTypes.ASSIGNMENT:
        comment.att('title', rest.topic);
        comment.att('initiator', rest.initiator);
        comment.att('performer', rest.performer);
        if (get(rest, 'dueDate')) {
          comment.att('dueDate', rest.dueDate);
        }
        if (get(rest, 'priority.id')) {
          comment.att('priority', rest.priority.id);
        }
        break;
      default:
        break;
    }

    if (isInternal) {
      comment.att('tags', [{ type: 'INTERNAL', name: {} }]);
    }

    return comment.save();
  };

  update = ({ id, text, record, selectedType, ...rest } = {}) => {
    const comment = Records.getRecordToEdit(id);

    comment.att('text', text);
    comment.att('_type', selectedType.id);
    comment.att('_parent', record);
    comment.att('_parentAtt', 'has-ecos-activities:ecosActivities');

    switch (selectedType.id) {
      case ActivityTypes.MEETING:
      case ActivityTypes.CALL:
      case ActivityTypes.EMAIL:
        comment.att('topic', rest.topic);
        comment.att('activityDate', rest.activityDate);
        if (get(rest, 'activityDuration.id')) {
          comment.att('activityDuration', rest.activityDuration.id);
        }
        if (get(rest, 'participants') && isArray(rest.participants)) {
          comment.att('participants', rest.participants || []);
        }
        comment.att('responsible', rest.responsible);
        break;
      default:
        break;
    }

    return comment.save();
  };

  delete = id => {
    const ids = Array.isArray(id) ? id : [id];

    return Records.remove(ids);
  };
}
