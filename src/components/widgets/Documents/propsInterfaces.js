import PropTypes from 'prop-types';

export const DynamicTypeInterface = {
  type: PropTypes.string.isRequired,
  name: PropTypes.string,
  multiple: PropTypes.bool,
  mandatory: PropTypes.bool,
  loadedBy: PropTypes.string,
  countDocuments: PropTypes.number,
  lastDocumentRef: PropTypes.string,
  formId: PropTypes.oneOfType([() => null, PropTypes.string])
};

export const TypeSettingsInterface = {
  multiple: PropTypes.bool,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      attribute: PropTypes.string,
      label: PropTypes.string,
      name: PropTypes.string,
      position: PropTypes.number,
      visible: PropTypes.bool
    })
  )
};

export const AvailableTypeInterface = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  formId: PropTypes.oneOfType([() => null, PropTypes.string]),
  parent: PropTypes.oneOfType([() => null, PropTypes.string])
};

export let GrouppedTypeInterface = {};

GrouppedTypeInterface = {
  ...AvailableTypeInterface,
  isSelected: PropTypes.bool,
  mandatory: PropTypes.bool,
  multiple: PropTypes.bool,
  locked: PropTypes.bool,
  countDocuments: PropTypes.number,
  items: PropTypes.arrayOf(PropTypes.shape(GrouppedTypeInterface))
};

export const DocumentInterface = {
  id: PropTypes.string.isRequired,
  loadedBy: PropTypes.string,
  modified: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  typeName: PropTypes.string
};
