export function getCommentForWeb(source) {
  if (!source || (source && !Object.keys(source).length)) {
    return {};
  }

  const target = {};

  target.firstName = source.author.firstName;
  target.middleName = source.author.middleName;
  target.lastName = source.author.lastName;
  target.text = source.text;
  target.avatar = `/share/proxy/alfresco/citeck/ecos/image/thumbnail?nodeRef=${source.author.id}&property=ecos:photo&width=150&height=150`;
  target.dateCreate = source.createdAt;
  target.dateModify = source.modifiedAt;
  target.id = source.id;
  target.canEdit = source.permissions.canEdit;
  target.canDelete = source.permissions.canDelete;

  return target;
}
