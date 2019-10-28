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
  parentForm: PropTypes.object,
  triggerEventOnTableChange: PropTypes.func,
  viewOnly: PropTypes.bool
};
