import React from 'react';

export default ({ width = 19, height = 19, viewBox = '0 0 19 19', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4335 6.90812L9.12502 2.59961M9.12502 2.59961L4.81651 6.90812M9.12502 2.59961L9.12502 11.7911"
      stroke="#B7B7B7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.09302 13.3906L3.09302 14.2523C3.09302 15.2041 3.86461 15.9757 4.81642 15.9757L13.4334 15.9757C14.3853 15.9757 15.1568 15.2041 15.1568 14.2523V13.3906"
      stroke="#B7B7B7"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
