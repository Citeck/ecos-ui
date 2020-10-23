import PropTypes from 'prop-types';

export default {
  permissionsDef: PropTypes.objectOf(
    PropTypes.shape({
      matrix: PropTypes.object,
      rules: PropTypes.arrayOf(PropTypes.object)
    })
  ),
  roles: PropTypes.arrayOf(
    PropTypes.objectOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
      })
    )
  ),
  statuses: PropTypes.arrayOf(
    PropTypes.objectOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
      })
    )
  ),
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  onDelete: PropTypes.func
};
