import React from 'react';

export default ({ width = 29, height = 29, viewBox = '0 0 29 29', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="6" transform="matrix(-1.31134e-07 -1 -1 1.31134e-07 28.25 28.0996)" fill="#F3F3F3" />
    <path d="M16.25 10.0996L12.25 14.0996L16.25 18.0996" stroke="#B7B7B7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
