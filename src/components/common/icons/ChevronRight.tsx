import React from 'react';

export default ({ width = 14, height = 14, viewBox = '0 0 14 14', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_392_33354)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.29289 11.7071C4.90237 11.3166 4.90237 10.6834 5.29289 10.2929L8.58579 7L5.29289 3.70711C4.90237 3.31658 4.90237 2.68342 5.29289 2.29289C5.68342 1.90237 6.31658 1.90237 6.70711 2.29289L10.7071 6.29289C11.0976 6.68342 11.0976 7.31658 10.7071 7.70711L6.70711 11.7071C6.31658 12.0976 5.68342 12.0976 5.29289 11.7071Z"
        fill="#B7B7B7"
      />
    </g>
    <defs>
      <clipPath id="clip0_392_33354">
        <rect width="14" height="14" fill="white" transform="translate(0 14) rotate(-90)" />
      </clipPath>
    </defs>
  </svg>
);
