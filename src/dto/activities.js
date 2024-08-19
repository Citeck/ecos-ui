import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { getBool, getColorByString } from '../helpers/util';
import { t } from '../helpers/export/util';
import UserService from '../services/UserService';
import { AllowedTagTypes, TagColorByType, typeInternal } from '../constants/comments';

export const getTag = data => {
  const type = get(data, 'type');
  const name = get(data, 'name');

  if (!type || typeof type !== 'string' || !AllowedTagTypes.includes(type.toLowerCase())) {
    return { title: t(name) };
  }

  return {
    title: `${t(type)}: ${t(name)}`,
    color: TagColorByType[type.toUpperCase()] || getColorByString(type.toLowerCase())
  };
};

export function getCommentForWeb(source) {
  if (isEmpty(source)) {
    return {};
  }

  const target = {};
  const author = source.author || {};
  const editor = source.editor || {};
  const permissions = source.permissions || {
    canEdit: source.canEdit,
    canDelete: source.canEdit
  };

  if (source.id) {
    target.id = source.id;
  }

  target.text = source.text;
  target.dateCreate = source.createdAt;
  target.activityDate = source.activityDate;

  target.activityDuration = source.activityDuration;
  target.resultActivity = source.resultActivity;
  target.priority = source.priority;
  target.dueDate = source.dueDate;
  target.commentActivity = source.commentActivity;
  target.assignment = source.assignment;
  target.performer = source.performer;
  target.initiator = source.initiator;
  target.participants = source.participants;
  target.responsible = source.responsible;
  target.title = source.title;

  target.dateModify = source.modifiedAt;
  target.edited = getBool(source.edited);
  target.editorUserName = editor.userName;
  target.editorName = editor.displayName;

  target.middleName = author.middleName || '';
  target.firstName = author.firstName || '';
  target.displayName = author.displayName || '';
  target.lastName = author.lastName || '';
  target.avatar = UserService.getAvatarUrl(author.avatarUrl, { height: 150 });
  target.tags = Array.isArray(source.tags) ? source.tags.filter(item => !isEmpty(item)).map(getTag) : [];
  target.userName = author.userName || '';

  target.canEdit = !!permissions.canEdit;
  target.canDelete = !!permissions.canDelete;

  target.isInternal = Array.isArray(source.tags) ? source.tags.some(tag => !isEmpty(tag) && tag.type === typeInternal) : false;

  target.type = source.type;
  target.status = source.status;

  return target;
}
