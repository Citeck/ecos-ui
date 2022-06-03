import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import Popper from '../../Popper';
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
    if (Array.isArray(cell)) {
      return cell.join(', ');
    }

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

  renderTooltipContent = () => {
    const content = this.value(this.props.cell);

    if (isEmpty(content)) {
      return null;
    }

    return <div className="ecos-formatter__tooltip-content">{content}</div>;
  };

  PopperWrapper = React.memo(props => {
    return (
      <Popper
        showAsNeeded
        text={props.text}
        icon="icon-question"
        popupClassName="ecos-formatter-popper"
        contentComponent={props.contentComponent}
      >
        {props.children}
      </Popper>
    );
  });

  render() {
    return <this.PopperWrapper text={this.value(this.props.cell)} />;
  }
}
