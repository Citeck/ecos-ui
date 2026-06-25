import PropTypes from 'prop-types';
import React from 'react';

const CheckboxIcon = ({ checked, indeterminate, disabled, width = 14, height = 14 }) => {
  const radius = 4;

  if (indeterminate) {
    return (
      <svg width={width} height={height} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="1"
          y="1"
          width="12"
          height="12"
          rx={radius}
          ry={radius}
          fill={disabled ? '#E0E0E0' : 'var(--primary-color)'}
          stroke={disabled ? '#E0E0E0' : 'var(--primary-color)'}
          strokeWidth="1.5"
        />
        <rect x="5.5" y="9" width="9" height="2" rx="1" ry="1" fill="white" />
      </svg>
    );
  }

  if (checked) {
    return (
      <svg width={width} height={height} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="1"
          y="1"
          width="12"
          height="12"
          rx={radius}
          ry={radius}
          fill="var(--primary-color)"
          stroke="var(--primary-color)"
          strokeWidth="1.5"
        />
        <path d="M4.3 7.2L6.2 9.1L9.8 5.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // unchecked state
  return (
    <svg width={width} height={height} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx={radius}
        ry={radius}
        fill="white"
        stroke={disabled ? '#E0E0E0' : '#D0D5DD'}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default CheckboxIcon;
