import React from 'react';

export default ({ width = 28, height = 28, viewBox = '0 0 28 28', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 21L17.5 14L10.5 7" stroke="#606060" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
