export function getCommentForWeb(source) {
  if (!source || (source && !Object.keys(source).length)) {
    return {};
  }

  const target = {};

  target.userName = [source.author.firstName, source.author.middleName, source.author.lastName].join(' ');
  target.text = source.text;
  target.avatar = `/share/proxy/alfresco/citeck/ecos/image/thumbnail?nodeRef=${source.author.id.storeRef.protocol}://${
    source.author.id.storeRef.identifier
  }/${source.author.id.id}&property=ecos:photo&width=150&height=150`;
  target.dateCreate = source.createdAt;
  target.dateModify = source.modifiedAt;
  target.id = source.id;
  target.canEdit = source.permissions.canEdit;
  target.canDelete = source.permissions.canDelete;

  return target;
}
