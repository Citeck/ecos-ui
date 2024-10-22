import React from 'react';

export default ({ width = 19, height = 19, viewBox = '0 0 19 19', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.07568 8.28329L9.38419 12.5918M9.38419 12.5918L13.6927 8.28329M9.38419 12.5918L9.38419 3.40031"
      stroke="#B7B7B7"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.35229 14.1914L3.35229 15.0531C3.35229 16.0049 4.12389 16.7765 5.0757 16.7765L13.6927 16.7765C14.6445 16.7765 15.4161 16.0049 15.4161 15.0531V14.1914"
      stroke="#B7B7B7"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
