import React from 'react';

export default ({ width = 23, height = 16, color = 'white' }) => (
  <svg width={width} height={height} viewBox="0 0 23 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.50732 9L13.5073 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M9.49951 3L15.4922 8.99265L9.49951 14.9853" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.4922 15V2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
