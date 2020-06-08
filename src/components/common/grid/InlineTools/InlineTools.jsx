import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { Tooltip } from '../../../common';
import { IcoBtn } from '../../../common/btns';

import './InlineTools.scss';

const mapStateToProps = (state, props) => {
  const reduxKey = get(props, 'reduxKey', 'journals');
  const stateId = get(props, 'stateId', '');
  const toolsKey = get(props, 'toolsKey', 'inlineToolSettings');
  const newState = state[reduxKey][stateId] || {};

  return {
    className: props.className,
    inlineToolSettings: newState[toolsKey],
    selectedRecords: newState.selectedRecords || [],
    selectAllRecords: newState.selectAllRecords
  };
};

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

  static renderAction(action, idx, withTooltip = false) {
    const icon = action.icon || 'icon-empty-icon';
    const id = `tooltip-${action.order}-${action.type}-${idx}`;
    const classes = classNames('ecos-inline-tools-btn ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_x-step_10', {
      'ecos-btn_hover_t_red': action.theme === 'danger'
    });

    if (!withTooltip) {
      return <IcoBtn key={idx} title={action.name} icon={icon} onClick={action.onClick} className={classes} />;
    }

    return (
      <Tooltip key={idx} target={id} uncontrolled text={action.name}>
        <IcoBtn id={id} icon={icon} onClick={action.onClick} className={classes} />
      </Tooltip>
    );
  }

  render() {
    const {
      className,
      inlineToolSettings: { top, height, left, actions = [], row = {} },
      selectedRecords,
      selectAllRecords,
      actionsProps,
      withTooltip
    } = this.props;

    if (!height) {
      return null;
    }

    const selected = selectedRecords.includes(row.id) || selectAllRecords;

    return (
      <div style={{ top, left, height }} className={classNames('ecos-inline-tools', className, { 'ecos-inline-tools_selected': selected })}>
        <div className="ecos-inline-tools-actions" {...actionsProps}>
          {actions.map((action, idx) => InlineTools.renderAction(action, idx, withTooltip))}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(InlineTools);
