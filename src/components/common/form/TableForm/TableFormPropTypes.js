import PropTypes from 'prop-types';

export default {
  createVariants: PropTypes.array,
  columns: PropTypes.array,
  error: PropTypes.any,
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  noColHeaders: PropTypes.bool,
  isCompact: PropTypes.bool,
  multiple: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  isStaticModalTitle: PropTypes.bool,
  customStringForConcatWithStaticTitle: PropTypes.string,
  onChange: PropTypes.func,
  isSelectableRows: PropTypes.bool,
  onSelectRows: PropTypes.func,
  viewOnly: PropTypes.bool,
  parentForm: PropTypes.object,
  triggerEventOnTableChange: PropTypes.func,
  isUsedJournalActions: PropTypes.bool,
  displayElements: PropTypes.shape({
    create: PropTypes.bool,
    view: PropTypes.bool,
    edit: PropTypes.bool,
    delete: PropTypes.bool,
    clone: PropTypes.bool,
    preview: PropTypes.bool
  }),
  nonSelectableRows: PropTypes.array,
  importButton: PropTypes.shape({
    enable: PropTypes.bool,
    onChange: PropTypes.func
  })
};
