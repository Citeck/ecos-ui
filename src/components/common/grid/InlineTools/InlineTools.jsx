import React, { Component } from 'react';
import PropTypes from 'prop-types';
import connect from 'react-redux/es/connect/connect';
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
    inlineToolSettings: newState[toolsKey]
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
    const inlineToolsActionClassName = 'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_x-step_10';
    let themeClass = 'ecos-btn_hover_t-dark-brown';

    if (action.theme === 'danger') {
      themeClass = 'ecos-btn_hover_t_red';
    }

    if (!withTooltip) {
      return (
        <IcoBtn
          key={idx}
          title={action.name}
          icon={action.icon}
          onClick={action.onClick}
          className={classNames(inlineToolsActionClassName, themeClass)}
        />
      );
    }

    const id = `tooltip-${action.order}-${action.type}-${idx}`;

    return (
      <Tooltip target={id} uncontrolled text={action.name}>
        <IcoBtn
          id={id}
          key={idx}
          icon={action.icon}
          onClick={action.onClick}
          className={classNames(inlineToolsActionClassName, themeClass)}
        />
      </Tooltip>
    );
  }

  render() {
    const {
      className,
      inlineToolSettings: { top, height, left, actions = [] },
      actionsProps,
      withTooltip
    } = this.props;

    if (!height) {
      return null;
    }

    return (
      <div style={{ top, left }} className={classNames('ecos-inline-tools', className)}>
        <div style={{ height }} className="ecos-inline-tools-border-left" />
        <div style={{ height }} className="ecos-inline-tools-actions" {...actionsProps}>
          {actions.map((action, idx) => InlineTools.renderAction(action, idx, withTooltip))}
        </div>
        <div className="ecos-inline-tools-border-bottom" />
      </div>
    );
  }
}

export default connect(mapStateToProps)(InlineTools);
