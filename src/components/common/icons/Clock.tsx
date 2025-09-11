import React from 'react';

export default ({ width = 13, height = 13, viewBox = '0 0 18 18', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_1750_5178)">
      <path
        d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z"
        stroke="#606060"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 4.5V9L12 10.5" stroke="#606060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
