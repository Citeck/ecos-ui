import React from 'react';

// The kanban view icon — an SVG replica of the `citeck` font's `icon-kanban` glyph (three columns,
// a short card over a tall one), drawn on the shared 20x18 box of the journal view-mode icons
// (VIEW_TAB_ICON_BOX). Replaced for the same reason as the list glyph: the font's ink sits on
// fractional pixels and text positions snap to whole pixels, so glyphs and SVGs could never share
// the same rows (COREDEV-349). Ink: 17x18 on integer coordinates, keeping the glyph's slightly
// right-of-centre stance in the box.
export default ({ width = 20, height = 18, viewBox = '0 0 20 18', fill = 'none', color = '#b7b7b7' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="0" width="5" height="5" rx="2" fill={color} />
    <rect x="8" y="0" width="5" height="5" rx="2" fill={color} />
    <rect x="14" y="0" width="5" height="5" rx="2" fill={color} />
    <rect x="2" y="7" width="5" height="11" rx="2" fill={color} />
    <rect x="8" y="7" width="5" height="11" rx="2" fill={color} />
    <rect x="14" y="7" width="5" height="11" rx="2" fill={color} />
  </svg>
);
