import React from 'react';

export default ({ width = 30, height = 30, viewBox = '0 0 30 30', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <rect x="3.27728" y="3.98784" width="8.56128" height="8.56128" rx="1.11955" stroke="#767676" strokeWidth="1.97568" />
    <rect x="16.6132" y="3.98784" width="8.56128" height="8.56128" rx="1.11955" stroke="#767676" strokeWidth="1.97568" />
    <rect x="3.27728" y="17.3237" width="8.56128" height="8.56128" rx="1.11955" stroke="#767676" strokeWidth="1.97568" />
    <rect
      x="14.8435"
      y="21.5815"
      width="8.52409"
      height="8.52409"
      rx="1.11469"
      transform="rotate(-45 14.8435 21.5815)"
      stroke="#7396CD"
      strokeWidth="1.9671"
    />
  </svg>
);
