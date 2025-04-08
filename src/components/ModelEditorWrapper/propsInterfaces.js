import PropTypes from 'prop-types';

export const ToolsInterface = {
  icon: PropTypes.string,
  action: PropTypes.func.isRequired,
  text: PropTypes.string,
  id: PropTypes.string.isRequired,
  trigger: PropTypes.string,
  className: PropTypes.string
};
