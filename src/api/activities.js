import get from 'lodash/get';
import isArray from 'lodash/isArray';

import Records from '../components/Records';
import { SourcesId } from '../constants';
import { ActivityTypes } from '../constants/activity';

const EMODEL_FIELDS = {
  title: 'title',
  text: 'text',
  createdAt: '_created',
  modifiedAt: '_modified',
  status: '_status{id,displayName:?disp}',
  activityDate: 'activityDate',
  activityDuration: 'activityDuration',
  resultActivity: 'result',
  priority: 'priority',
  dueDate: 'dueDate',
  commentActivity: 'comment',
  assignment: 'assignment',
  type: '_type{id,displayName:?disp}',
  participants: 'participants[]{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName}',
  performer: 'performer{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,avatarUrl:avatar.url}',
  initiator: 'initiator{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,avatarUrl:avatar.url}',
  responsible: 'responsible{authorityName:?localId,userName:?localId,displayName:?disp,firstName,lastName,avatarUrl:avatar.url}',
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
        query: { t: 'eq', att: '_parent', val: record },
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

  create = ({ text, record, isInternal, selectedType, ...rest } = {}) => {
    const comment = Records.getRecordToEdit(`${SourcesId.EMODEL_ACTIVITY}@`);

    comment.att('text', text);
    comment.att('_type', selectedType.id);
    comment.att('_parent', record);
    comment.att('_parentAtt', 'has-ecos-activities:ecosActivities');

    switch (selectedType.id) {
      case ActivityTypes.MEETING:
      case ActivityTypes.CALL:
      case ActivityTypes.EMAIL:
        comment.att('activityDate', rest.activityDate);
        comment.att('activityDuration', rest.activityDuration.id);
        comment.att('responsible', rest.responsible);
        if (get(rest, 'participants') && isArray(rest.participants) && rest.participants.length > 0) {
          comment.att('participants', rest.participants || []);
        }
        break;
      case ActivityTypes.ASSIGNMENT:
        comment.att('title', rest.titleAssignment);
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
        comment.att('activityDate', rest.activityDate);
        comment.att('activityDuration', rest.activityDuration);
        comment.att('responsible', rest.responsible);
        break;
      case ActivityTypes.ASSIGNMENT:
        comment.att('title', rest.titleAssignment);
        comment.att('dueDate', rest.dueDate);
        comment.att('priority', rest.priority);
        comment.att('initiator', rest.initiator);
        comment.att('performer', rest.performer);
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
