export function getCommentForWeb(source) {
  if (!source || (source && !Object.keys(source).length)) {
    return {};
  }

  const target = {};

  target.userName = [source.author.firstName, source.author.middleName, source.author.lastName].join(' ');
  target.text = source.text;
  target.avatar = source.author.avatar;
  target.dateCreate = source.createdAt;
  target.dateModify = source.modifiedAt;
  target.id = source.id;
  target.canEdit = source.permissions.canEdit;
  target.canDelete = source.permissions.canDelete;

  return target;
}
