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
        <path d="M5.5 10L8.5 13L14.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
