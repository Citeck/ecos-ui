import React from 'react';

// The journal (table) view icon — an SVG replica of the `citeck` font's `icon-list` glyph, drawn
// on the shared 20x18 box of the journal view-mode icons (VIEW_TAB_ICON_BOX). The glyph painted
// the same three bars, but its ink landed on fractional pixels (x from 1.5, rows from 10.75) and
// the browser snaps text to whole-pixel positions, so no CSS offset could ever line it up with
// the SVG icons' integer rows — the row's SVGs sat a visible quarter-pixel below the glyphs
// (COREDEV-349). Ink: 18x18, centred in the box, every edge on integer coordinates.
export default ({ width = 20, height = 18, viewBox = '0 0 20 18', fill = 'none', color = '#b7b7b7' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="0" width="18" height="4" rx="2" fill={color} />
    <rect x="1" y="7" width="18" height="4" rx="2" fill={color} />
    <rect x="1" y="14" width="18" height="4" rx="2" fill={color} />
  </svg>
);
