import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import './GridSkeleton.scss';

const DEFAULT_ROWS = 8;
const DEFAULT_COLS = 5;

/**
 * Table-shaped shimmer placeholder shown while the journal grid loads its primary data on init.
 * Rendered as an opaque overlay inside `.ecos-journal-dashlet__grid` (same box the `<Loader blur />`
 * spinner used to cover), so the area under the toolbar shows a skeleton table instead of a round loader.
 */
const GridSkeleton = ({ columns = DEFAULT_COLS, rows = DEFAULT_ROWS, maxHeight }) => {
  const cols = Math.max(1, columns || DEFAULT_COLS);

  const renderRow = (seed, isHeader) => (
    <div
      key={isHeader ? 'header' : `row-${seed}`}
      className={classNames('ecos-journal-grid-skeleton__row', { 'ecos-journal-grid-skeleton__row_header': isHeader })}
    >
      {Array.from({ length: cols }, (_, c) => (
        <div key={c} className="ecos-journal-grid-skeleton__cell">
          {/* Vary bar width per cell/row so it reads as content, not a grid of identical blocks. */}
          <span
            className="ecos-journal-grid-skeleton__bar ecos-journal-grid-skeleton__shimmer"
            style={{ width: `${55 + ((seed * 13 + c * 29) % 40)}%` }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="ecos-journal-grid-skeleton" style={{ ...(maxHeight && { maxHeight }) }} aria-hidden="true">
      {renderRow(0, true)}
      {Array.from({ length: rows }, (_, r) => renderRow(r + 1, false))}
    </div>
  );
};

GridSkeleton.propTypes = {
  columns: PropTypes.number,
  rows: PropTypes.number,
  maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default GridSkeleton;
