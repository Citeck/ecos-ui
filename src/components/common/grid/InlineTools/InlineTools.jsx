import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { renderAction } from './helpers';
import './InlineTools.scss';
import Loader from '../../Loader';

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
      withTooltip,
      loading
    } = this.props;

    const selected = selectedRecords.includes(row.id) || selectAllPageRecords;

    return (
      <div
        style={style}
        className={classNames('ecos-inline-tools', className, {
          'ecos-inline-tools_selected': selected,
          'ecos-inline-tools__loading': loading
        })}
      >
        <div className="ecos-inline-tools-actions" {...actionsProps}>
          {loading && <Loader type="points" width="80%" height="100%" />}
          {!loading && actions.map((action, idx) => renderAction(action, idx, withTooltip))}
        </div>
      </div>
    );
  }
}

export default InlineTools;
