import React from 'react';

export default ({ width = 10, height = 2, viewBox = '0 0 10 2', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <circle cx="1" cy="1" r="1" fill="#444444" />
    <circle cx="5" cy="1" r="1" fill="#444444" />
    <circle cx="9" cy="1" r="1" fill="#444444" />
  </svg>
);
