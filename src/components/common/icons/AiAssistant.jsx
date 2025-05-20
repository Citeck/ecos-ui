import React from 'react';
import PropTypes from 'prop-types';

const AiAssistant = ({ className }) => {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.48 2 2 6.48 2 12C2 13.4178 2.26783 14.7715 2.75747 16.0092L2 22L8.00814 21.2326C9.23331 21.7146 10.5784 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.7418 20 9.54839 19.7236 8.47826 19.2222L8 19L4 20L5 16L4.77778 15.5217C4.27638 14.4516 4 13.2582 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM8 13C8.55 13 9 12.55 9 12C9 11.45 8.55 11 8 11C7.45 11 7 11.45 7 12C7 12.55 7.45 13 8 13ZM13 12C13 12.55 12.55 13 12 13C11.45 13 11 12.55 11 12C11 11.45 11.45 11 12 11C12.55 11 13 11.45 13 12ZM16 13C16.55 13 17 12.55 17 12C17 11.45 16.55 11 16 11C15.45 11 15 11.45 15 12C15 12.55 15.45 13 16 13Z"
        fill="currentColor"
      />
    </svg>
  );
};

AiAssistant.propTypes = {
  className: PropTypes.string
};

export default AiAssistant;
