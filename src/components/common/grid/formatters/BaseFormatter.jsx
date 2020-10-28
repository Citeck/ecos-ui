import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { BaseEditor } from '../editors';

import './style.scss';

export default class BaseFormatter extends Component {
  static propTypes = {
    cell: PropTypes.any,
    params: PropTypes.object,
    row: PropTypes.object,
    rowIndex: PropTypes.number
  };

  static getFilterValue(cell) {
    return this.prototype.value(cell);
  }

  static getEditor(editorProps, value) {
    return <BaseEditor {...editorProps} value={value} />;
  }

  static getId(cell) {
    return this.prototype.getId(cell);
  }

  tooltipRef = React.createRef();

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

  render() {
    return <>{this.value(this.props.cell)}</>;
  }
}
