import React from 'react';

// Laid out on the same 20x18 ink grid as the other journal view-mode icons, with the viewBox cropped
// to the ink so a nominal 20x18 icon paints 20x18. The previous drawing sat on fractional
// coordinates (y 2.2..20.5 inside a 20x22 viewBox), which both shrank it and left half-transparent
// rows at its edges that read as a gap above the icon (COREDEV-349).
export default ({ width = 20, height = 18, viewBox = '0 0 20 18', fill = 'none', color = '#b7b7b7' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    {/* Preview pane */}
    <rect x="0" y="0" width="6" height="11" rx="2" fill={color} />
    {/* Two lines of the entry beside it */}
    <rect x="9" y="0" width="11" height="4" rx="2" fill={color} />
    <rect x="9" y="7" width="11" height="4" rx="2" fill={color} />
    {/* The next entry */}
    <rect x="0" y="14" width="20" height="4" rx="2" fill={color} />
  </svg>
);
