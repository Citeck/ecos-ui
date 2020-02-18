import PropTypes from 'prop-types';

export default {
  journalId: PropTypes.string,
  defaultValue: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  displayColumns: PropTypes.array,
  onChange: PropTypes.func,
  onError: PropTypes.func,
  disabled: PropTypes.bool,
  isCompact: PropTypes.bool,
  isStaticModalTitle: PropTypes.bool,
  customStringForConcatWithStaticTitle: PropTypes.string,
  isSelectableRows: PropTypes.bool,
  onSelectRows: PropTypes.func,
  parentForm: PropTypes.object,
  nonSelectableRows: PropTypes.array,
  triggerEventOnTableChange: PropTypes.func,
  viewOnly: PropTypes.bool,
  displayElements: PropTypes.shape({
    view: PropTypes.bool,
    edit: PropTypes.bool,
    delete: PropTypes.bool
  })
};
