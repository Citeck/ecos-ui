import PropTypes from 'prop-types';

export const GrouppedTypeInterface = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  formId: PropTypes.string,
  parent: PropTypes.oneOfType([() => null, PropTypes.string]),
  isSelected: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.shape(GrouppedTypeInterface))
};

export const DynamicTypeInterface = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string,
  formId: PropTypes.string,
  name: PropTypes.string,
  countDocuments: PropTypes.number,
  multiple: PropTypes.bool,
  mandatory: PropTypes.bool
};
