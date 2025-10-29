import React from 'react';

export default ({ width = 24, height = 24, viewBox = '0 0 24 24', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.233 8.767C18.6723 9.20634 18.6723 9.91866 18.233 10.358L13.358 15.233C12.9187 15.6723 12.2063 15.6723 11.767 15.233L6.892 10.358C6.45267 9.91865 6.45267 9.20634 6.892 8.767C7.33134 8.32766 8.04366 8.32766 8.483 8.767L12.5625 12.8465L16.642 8.767C17.0813 8.32767 17.7937 8.32767 18.233 8.767Z"
      fill="#0F172A"
    />
  </svg>
);
