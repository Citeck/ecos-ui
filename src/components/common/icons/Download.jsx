import React from 'react';

export default ({ width = 15, height = 15, viewBox = '0 0 15 15', fill = 'none' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <circle cx="7.5" cy="7.5" r="7" fill="currentColor" />
    <path
      d="M5.31094 6.63675L7.43328 8.75909M7.43328 8.75909L9.55562 6.63675M7.43328 8.75909L7.43328 4.23143"
      stroke="white"
      strokeWidth="0.985185"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.46198 9.54715L4.46198 9.97162C4.46198 10.4405 4.84206 10.8206 5.31091 10.8206L9.55559 10.8206C10.0244 10.8206 10.4045 10.4405 10.4045 9.97162V9.54715"
      stroke="white"
      strokeWidth="0.985185"
      strokeLinecap="round"
    />
  </svg>
);
