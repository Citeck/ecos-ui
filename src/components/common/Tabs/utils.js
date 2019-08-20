import PropTypes from 'prop-types';

export const commonOneTabPropTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  label: PropTypes.string,
  className: PropTypes.string,
  isActive: PropTypes.bool,
  hasHover: PropTypes.bool,
  onClick: PropTypes.func
};

export const commonOneTabDefaultProps = {
  id: '',
  label: '',
  className: '',
  isActive: false,
  hasHover: false,
  onClick: () => null
};

export const commonTabsPropTypes = {
  items: PropTypes.array,
  className: PropTypes.string,
  classNameTab: PropTypes.string,
  hasHover: PropTypes.bool,
  keyField: PropTypes.string,
  valueField: PropTypes.string,
  activeTabKey: PropTypes.string,
  onClick: PropTypes.func
};

export const commonTabsDefaultProps = {
  items: [],
  className: '',
  hasHover: false,
  keyField: 'id',
  valueField: 'label',
  activeTabKey: '',
  valuePrefix: '',
  onClick: () => null
};
