import React from 'react';

export default ({ width = 19, height = 19, viewBox = '0 0 19 19', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.9519 6.80843L9.64339 2.49992M9.64339 2.49992L5.33488 6.80843M9.64339 2.49992L9.64339 11.6914"
      stroke="#B7B7B7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.61157 13.291L3.61157 14.1527C3.61157 15.1045 4.38317 15.8761 5.33498 15.8761L13.952 15.8761C14.9038 15.8761 15.6754 15.1045 15.6754 14.1527V13.291"
      stroke="#B7B7B7"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
