import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { renderAction } from './helpers';

import './InlineTools.scss';

class InlineTools extends Component {
  static propTypes = {
    reduxKey: PropTypes.string,
    stateId: PropTypes.string,
    toolsKey: PropTypes.string,
    className: PropTypes.string,
    inlineToolSettings: PropTypes.object,
    actionsProps: PropTypes.object,
    withTooltip: PropTypes.bool
  };

  static defaultProps = {
    reduxKey: 'journals',
    stateId: '',
    toolsKey: 'inlineToolSettings',
    className: '',
    inlineToolSettings: {},
    actionsProps: {},
    withTooltip: false
  };

  render() {
    const {
      className,
      inlineToolSettings: { actions = [], row = {}, ...style },
      selectedRecords,
      selectAllPageRecords,
      actionsProps,
      withTooltip
    } = this.props;

    if (!style.height) {
      return null;
    }

    const selected = selectedRecords.includes(row.id) || selectAllPageRecords;

    return (
      <div style={style} className={classNames('ecos-inline-tools', className, { 'ecos-inline-tools_selected': selected })}>
        <div className="ecos-inline-tools-actions" {...actionsProps}>
          {actions.map((action, idx) => renderAction(action, idx, withTooltip))}
        </div>
      </div>
    );
  }
}

export default InlineTools;
