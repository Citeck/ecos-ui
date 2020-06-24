import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './InlineTools.scss';

class InlineToolsDisconnected extends Component {
  tools = () => {
    return (this.props.tools || []).map((action, idx) => React.cloneElement(action, { key: idx }));
  };

  render() {
    const { top, height, left, right, tools, selectedRecords, rowId, className, forwardedRef } = this.props;

    const selected = selectedRecords.includes(rowId);

    if (height) {
      return (
        <div
          ref={forwardedRef}
          style={{ top, height, left, right }}
          className={classNames('ecos-inline-tools', className, {
            'ecos-inline-tools_selected': selected
          })}
        >
          <div className="ecos-inline-tools-actions">{tools || []}</div>
        </div>
      );
    }

    return null;
  }
}

const numberOrStringType = PropTypes.oneOfType([PropTypes.number, PropTypes.string]);

InlineToolsDisconnected.propTypes = {
  rowId: numberOrStringType,
  top: numberOrStringType,
  height: numberOrStringType,
  tools: PropTypes.arrayOf(PropTypes.node),
  selectedRecords: PropTypes.arrayOf(numberOrStringType),
  className: PropTypes.string,
  forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
};

InlineToolsDisconnected.defaultProps = {
  selectedRecords: []
};

export default InlineToolsDisconnected;
