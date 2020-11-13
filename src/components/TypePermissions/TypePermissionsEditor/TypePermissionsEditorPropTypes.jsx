import PropTypes from 'prop-types';

export default {
  permissionsDef: PropTypes.shape({
    matrix: PropTypes.object,
    rules: PropTypes.array
  }),
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    })
  ),
  statuses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    })
  ),
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func
};
