import React from 'react';

export default ({ width = 21, height = 18, viewBox = '0 0 21 18', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 1.56C0 0.698436 0.698436 0 1.56 0H19.24C20.1016 0 20.8 0.698436 20.8 1.56C20.8 2.42156 20.1016 3.12 19.24 3.12H1.56C0.698436 3.12 0 2.42156 0 1.56Z"
      fill="white"
    />
    <path
      d="M0 8.84C0 7.97844 0.698436 7.28 1.56 7.28H19.24C20.1016 7.28 20.8 7.97844 20.8 8.84C20.8 9.70156 20.1016 10.4 19.24 10.4H1.56C0.698436 10.4 0 9.70156 0 8.84Z"
      fill="white"
    />
    <path
      d="M0 16.12C0 15.2584 0.698436 14.56 1.56 14.56H19.24C20.1016 14.56 20.8 15.2584 20.8 16.12C20.8 16.9816 20.1016 17.68 19.24 17.68H1.56C0.698436 17.68 0 16.9816 0 16.12Z"
      fill="white"
    />
  </svg>
);
