import PropTypes from 'prop-types';

export const commonOneTabPropTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  label: PropTypes.string,
  className: PropTypes.string,
  isActive: PropTypes.bool,
  hasHover: PropTypes.bool,
  hasHint: PropTypes.bool,
  onClick: PropTypes.func
};

export const commonOneTabDefaultProps = {
  id: '',
  label: '',
  className: '',
  isActive: false,
  hasHover: false,
  hasHint: false,
  onClick: null
};

export const commonTabsPropTypes = {
  items: PropTypes.array,
  className: PropTypes.string,
  classNameTab: PropTypes.string,
  hasHover: PropTypes.bool,
  hasHint: PropTypes.bool,
  widthFull: PropTypes.bool,
  narrow: PropTypes.bool,
  keyField: PropTypes.string,
  valueField: PropTypes.string,
  activeTabKey: PropTypes.string,
  onClick: PropTypes.func
};

export const commonTabsDefaultProps = {
  items: [],
  className: '',
  hasHover: false,
  hasHint: false,
  keyField: 'id',
  valueField: 'label',
  activeTabKey: '',
  valuePrefix: '',
  onClick: null
};
