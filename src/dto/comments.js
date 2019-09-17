import { isEmpty } from 'lodash';

export function getCommentForWeb(source) {
  if (isEmpty(source)) {
    return {};
  }

  const target = {};
  const author = source.author || {};
  const permissions = source.permissions || {};

  target.id = source.id;
  target.text = source.text;
  target.dateCreate = source.createdAt;
  target.dateModify = source.modifiedAt;

  target.firstName = author.firstName || '';
  target.middleName = author.middleName || '';
  target.lastName = author.lastName || '';
  target.displayName = author.displayName || '';
  target.avatar = `/share/proxy/alfresco/citeck/ecos/image/thumbnail?nodeRef=${author.id}&property=ecos:photo&width=150&height=150`;

  target.canEdit = !!permissions.canEdit;
  target.canDelete = !!permissions.canDelete;

  return target;
}
