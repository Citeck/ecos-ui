import React from 'react';

export default ({ width = 24, height = 24, viewBox = '0 0 24 24', fill = 'none', isLeft = false }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <rect width="9" height="4" rx="2" transform={isLeft ? 'matrix(-1 0 0 1 22 17)' : 'matrix(-1 0 0 1 11 17)'} fill="#b7b7b7" />
    <rect width="9" height="4" rx="2" transform={isLeft ? 'matrix(-1 0 0 1 22 10)' : 'matrix(-1 0 0 1 11 10)'} fill="#b7b7b7" />
    <rect width="9" height="4" rx="2" transform={isLeft ? 'matrix(-1 0 0 1 22 3)' : 'matrix(-1 0 0 1 11 3)'} fill="#b7b7b7" />
    <rect width="8" height="18" rx="2" transform={isLeft ? 'matrix(-1 0 0 1 11 3)' : 'matrix(-1 0 0 1 22 3)'} fill="#b7b7b7" />
  </svg>
);
