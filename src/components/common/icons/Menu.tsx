import React from 'react';

export default ({ width = 13, height = 13, viewBox = '0 0 14 14', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1H13" stroke="#B7B7B7" strokeWidth="2" strokeLinecap="round" />
    <path d="M6.45459 7L13 7" stroke="#B7B7B7" strokeWidth="2" strokeLinecap="round" />
    <path d="M6.45459 13L13 13" stroke="#B7B7B7" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
