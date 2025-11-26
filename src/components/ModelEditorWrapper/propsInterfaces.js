import PropTypes from 'prop-types';

export const ToolsInterface = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  action: PropTypes.func.isRequired,
  text: PropTypes.string,
  id: PropTypes.string.isRequired,
  trigger: PropTypes.string,
  className: PropTypes.string
};
