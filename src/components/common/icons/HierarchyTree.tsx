import React from 'react';

// Shares the 20x18 box of the journal view-mode icons (VIEW_TAB_ICON_BOX), but only fills its
// height: the ink is a square 18x18, centred with a whole unit of padding on each side. Filling
// the box's full 20-unit width made this naturally vertical shape wider than tall, which read as
// horizontally stretched next to its neighbours — the second round of COREDEV-349 (the first was
// the opposite: a viewBox with padding all around painted the icon a quarter smaller). All edges
// stay on integer coordinates so no half-covered pixel rows blur the drawing.
//
// The connectors are square-ended and run into the node pills: a rounded 2-unit cap butting
// against a pill's rounded end makes both shapes taper at the meeting point, which reads as a
// pinch. Hiding the connector ends inside the pills (and under each other) leaves only flat
// T-junctions in the union.
export default ({ width = 20, height = 18, viewBox = '0 0 20 18', fill = 'none', color = '#b7b7b7' }) => (
  <svg width={width} height={height} viewBox={viewBox} fill={fill} xmlns="http://www.w3.org/2000/svg">
    {/* Root node */}
    <rect x="1" y="0" width="8" height="4" rx="2" fill={color} />
    {/* Vertical trunk, its top hidden inside the root node */}
    <rect x="3" y="2" width="2" height="15" fill={color} />
    {/* Branch 1 → child 1; the branch spans from the trunk's left edge into the child */}
    <rect x="3" y="6" width="10" height="2" fill={color} />
    <rect x="11" y="5" width="8" height="4" rx="2" fill={color} />
    {/* Branch 2 → child 2 */}
    <rect x="3" y="15" width="10" height="2" fill={color} />
    <rect x="11" y="14" width="8" height="4" rx="2" fill={color} />
  </svg>
);
