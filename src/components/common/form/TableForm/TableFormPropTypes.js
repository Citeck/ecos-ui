import PropTypes from 'prop-types';

export const CreateVariantPropTypes = {
  recordRef: PropTypes.string,
  formKey: PropTypes.string,
  formRef: PropTypes.string,
  type: PropTypes.string,
  sourceId: PropTypes.string,
  typeRef: PropTypes.string,
  attributes: PropTypes.object
};

export default {
  createVariants: PropTypes.arrayOf(PropTypes.shape(CreateVariantPropTypes)),
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
  journalActions: PropTypes.object,
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
