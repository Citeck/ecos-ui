import React from 'react';

// Laid out on the same 20x18 ink grid as the other journal view-mode icons (PreviewList,
// WidgetsPreview): 4-unit node bars, 2-unit connectors, viewBox cropped to the ink so a nominal
// 18px icon paints 18px. The previous drawing sat on a 22-unit grid with 17x18 of ink in it and
// half-transparent connectors, so it rendered ~25% smaller and lighter than its neighbours in the
// journal header (COREDEV-349).
export default ({ width = 18, height = 17, viewBox = '0 0 20 18', fill = 'none', color = '#b7b7b7' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    {/* Root node */}
    <rect x="0" y="0" width="9" height="4" rx="2" fill={color} />
    {/* Vertical trunk */}
    <rect x="2" y="4" width="2" height="13" rx="1" fill={color} />
    {/* Branch 1 → child 1 */}
    <rect x="4" y="6" width="7" height="2" rx="1" fill={color} />
    <rect x="11" y="5" width="9" height="4" rx="2" fill={color} />
    {/* Branch 2 → child 2 */}
    <rect x="4" y="15" width="7" height="2" rx="1" fill={color} />
    <rect x="11" y="14" width="9" height="4" rx="2" fill={color} />
  </svg>
);
