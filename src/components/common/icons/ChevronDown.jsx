import React from 'react';

export default ({ width = 20, height = 21, viewBox = '0 0 20 21', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.63619 8.444C4.17692 7.90327 5.05361 7.90327 5.59434 8.444L10.1537 13.0034L14.7131 8.444C15.2538 7.90327 16.1305 7.90327 16.6713 8.444C17.212 8.98472 17.212 9.86141 16.6713 10.4021L11.1328 15.9406C10.5921 16.4813 9.71538 16.4813 9.17466 15.9406L3.63619 10.4021C3.09547 9.86141 3.09547 8.98472 3.63619 8.444Z"
      fill="#444444"
    />
  </svg>
);
