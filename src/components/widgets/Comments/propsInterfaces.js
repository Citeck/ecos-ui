import PropTypes from 'prop-types';

export const IdInterface = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

export const DateInterface = PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]);

export const CommentInterface = {
  avatar: PropTypes.string,
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  middleName: PropTypes.string,
  displayName: PropTypes.string,
  editorName: PropTypes.string,
  editorUserName: PropTypes.string,
  text: PropTypes.string.isRequired,
  dateCreate: DateInterface.isRequired,
  dateModify: DateInterface,
  id: IdInterface.isRequired,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
  edited: PropTypes.bool,
  tags: PropTypes.arrayOf(PropTypes.string)
};
