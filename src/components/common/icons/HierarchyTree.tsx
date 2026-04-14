import React from 'react';

export default ({ width = 22, height = 22, viewBox = '0 0 22 22', fill = 'none', color = '#b7b7b7' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    {/* Root node */}
    <rect x="1" y="1" width="8" height="4" rx="1.5" fill={color} />
    {/* Vertical trunk */}
    <rect x="4" y="5" width="2" height="14" rx="1" fill={color} opacity="0.5" />
    {/* Branch 1 → child 1 */}
    <rect x="5" y="8" width="5" height="2" rx="1" fill={color} opacity="0.5" />
    <rect x="10" y="7" width="8" height="4" rx="1.5" fill={color} />
    {/* Branch 2 → child 2 */}
    <rect x="5" y="16" width="5" height="2" rx="1" fill={color} opacity="0.5" />
    <rect x="10" y="15" width="8" height="4" rx="1.5" fill={color} />
  </svg>
);
