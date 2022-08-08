import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

import { getBool, getColorByString } from '../helpers/util';
import { t } from '../helpers/export/util';
import UserService from '../services/UserService';
import { AllowedTagTypes, TagColorByType } from '../constants/comments';

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
  const permissions = source.permissions || {};

  if (source.id) {
    target.id = source.id;
  }

  target.text = source.text;
  target.dateCreate = source.createdAt;

  target.edited = getBool(source.edited);
  target.dateModify = source.modifiedAt;
  target.editorName = editor.displayName;
  target.editorUserName = editor.userName;

  target.firstName = author.firstName || '';
  target.middleName = author.middleName || '';
  target.lastName = author.lastName || '';
  target.displayName = author.displayName || '';
  target.userName = author.userName || '';
  target.avatar = UserService.getAvatarUrl(author.avatarUrl, { height: 150 });
  target.tags = Array.isArray(source.tags) ? source.tags.filter(item => !isEmpty(item)).map(getTag) : [];

  target.canEdit = !!permissions.canEdit;
  target.canDelete = !!permissions.canDelete;

  return target;
}
