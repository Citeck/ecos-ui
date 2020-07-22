import React, { Component } from 'react';

import { BaseEditor } from '../editors';
import { Icon, Tooltip } from '../../index';

import './style.scss';

export default class BaseFormatter extends Component {
  static getFilterValue(cell) {
    return this.prototype.value(cell);
  }

  static getEditor(editorProps, value) {
    return <BaseEditor {...editorProps} value={value} />;
  }

  static getId(cell) {
    return this.prototype.getId(cell);
  }

  value(cell) {
    return cell || '';
  }

  getId(cell) {
    return cell || '';
  }

  getIsNeededTooltip = withTooltip => {
    this.setState(prevState => {
      if (prevState.withTooltip !== withTooltip) {
        return { withTooltip };
      }
    });
  };

  renderTooltip = ({ domId, text, contentComponent, elementId }) => {
    const { withTooltip } = this.state || {};

    return (
      <Tooltip
        showAsNeeded
        target={domId}
        elementId={elementId}
        uncontrolled
        text={text}
        getIsNeeded={this.getIsNeededTooltip}
        contentComponent={contentComponent}
        innerClassName="ecos-formatter__tooltip-inner"
        placement={'right'}
      >
        <Icon id={domId} className="icon-question ecos-formatter__tooltip-icon" hidden={!withTooltip} />
      </Tooltip>
    );
  };

  render() {
    return <>{this.value(this.props.cell)}</>;
  }
}
