import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import { IcoBtn } from '../../../common/btns';

import './InlineTools.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return { inlineToolSettings: newState.inlineToolSettings };
};

class InlineTools extends Component {
  static renderAction(action, idx) {
    const inlineToolsActionClassName = 'ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_x-step_10';

    let themeClass = 'ecos-btn_hover_t-dark-brown';
    if (action.theme === 'danger') {
      themeClass = 'ecos-btn_hover_t_red';
    }

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

  render() {
    const { top, height, left, actions = [] } = this.props.inlineToolSettings;

    if (height) {
      return (
        <div style={{ top, left }} className={'ecos-inline-tools'}>
          <div style={{ height }} className="ecos-inline-tools-border-left" />
          <div style={{ height }} className="ecos-inline-tools-actions">
            {actions.map((action, idx) => InlineTools.renderAction(action, idx))}
          </div>
          <div className="ecos-inline-tools-border-bottom" />
        </div>
      );
    }

    return null;
  }
}

export default connect(mapStateToProps)(InlineTools);
