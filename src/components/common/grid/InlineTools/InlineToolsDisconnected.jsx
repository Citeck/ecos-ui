import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { forwardRef } from 'react';

import './InlineTools.scss';

const InlineToolsDisconnected = forwardRef(({ tools, selectedRecords, rowId, className }, ref) => {
  const selected = selectedRecords.includes(rowId);

  return (
    <div
      ref={ref}
      className={classNames('ecos-inline-tools', className, {
        'ecos-inline-tools_selected': selected
      })}
    >
      <div className="ecos-inline-tools-actions">{tools || []}</div>
    </div>
  );
});

const numberOrStringType = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);

InlineToolsDisconnected.propTypes = {
  rowId: numberOrStringType,
  tools: PropTypes.arrayOf(PropTypes.node),
  selectedRecords: PropTypes.arrayOf(numberOrStringType),
  className: PropTypes.string
};

InlineToolsDisconnected.defaultProps = {
  selectedRecords: []
};

export default React.memo(InlineToolsDisconnected);
