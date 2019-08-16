import PropTypes from 'prop-types';

export const commonOneTabPropTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  label: PropTypes.string,
  isActive: PropTypes.bool,
  hasHover: PropTypes.bool,
  onClick: PropTypes.func
};

export const commonTabsPropTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      ...commonOneTabPropTypes
    })
  ),
  className: PropTypes.string,
  hasHover: PropTypes.bool
};

export const commonTabsDefaultProps = {
  items: [],
  className: '',
  hasHover: false
};
