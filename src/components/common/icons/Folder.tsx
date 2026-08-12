import React from 'react';

// Laid out on the same 20x18 ink grid as the other journal view-mode icons (HierarchyTree,
// PreviewList, WidgetsPreview), with the viewBox cropped to the ink so a nominal 20x18 icon paints
// 20x18. Replaces the `citeck` font's `icon-folder` glyph in the journal header: that glyph is drawn
// on a 1.32em body, so no font-size both matched the row's height and landed the tab's top edge on a
// whole pixel — it always kept a half-transparent row that read as a gap (COREDEV-349).
export default ({ width = 20, height = 18, viewBox = '0 0 20 18', fill = 'none', color = '#b7b7b7' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    {/* Tab */}
    <rect x="0" y="0" width="9" height="7" rx="2" fill={color} />
    {/* Body */}
    <rect x="0" y="3" width="20" height="15" rx="2" fill={color} />
  </svg>
);
