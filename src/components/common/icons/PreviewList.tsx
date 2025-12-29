import React from 'react';

export default ({ width = 22, height = 24, viewBox = '0 0 20 22', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="2.2" width="6" height="11" rx="2" fill="#b7b7b7" />
    <rect x="9.8" y="6" width="4" height="9" rx="2" transform="rotate(-90 10 6)" fill="#b7b7b7" />
    <rect x="10" y="13" width="4" height="9" rx="2" transform="rotate(-90 10 13)" fill="#b7b7b7" />
    <rect x="0.5" y="20" width="4" height="18" rx="2" transform="rotate(-90 1 20)" fill="#b7b7b7" />
  </svg>
);
