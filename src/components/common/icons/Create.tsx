import React from 'react';

export default ({ width = 16, height = 16, viewBox = '0 0 16 16', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path d="M8.05023 2.30078L8.05023 13.8012" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M13.8005 8.05078L2.30006 8.05078" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
