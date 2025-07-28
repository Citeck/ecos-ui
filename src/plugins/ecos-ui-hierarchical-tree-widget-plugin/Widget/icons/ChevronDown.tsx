import React from 'react';

export default ({ width = 28, height = 28, viewBox = '0 0 28 28', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path d="M7 10.5L14 17.5L21 10.5" stroke="#606060" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
