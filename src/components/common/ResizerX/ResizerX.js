import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import { Icon } from '../';

import './style.scss';

class ResizerX extends React.Component {
  static propTypes = {
    leftBox: PropTypes.any,
    rightBox: PropTypes.any,
    className: PropTypes.string
  };

  static defaultProps = {
    className: ''
  };

  state = {
    resizing: false,
    startX: 0,
    startLeftWidth: 0,
    startRightWidth: 0
  };

  startResize = event => {
    event.preventDefault();

    const { leftBox, rightBox } = this.props;

    this.setState({
      resizing: true,
      startX: event.pageX,
      startLeftWidth: get(leftBox, 'offsetWidth', 0),
      startRightWidth: get(rightBox, 'offsetWidth', 0)
    });

    window.addEventListener('mousemove', this.doResize);
    window.addEventListener('mouseup', this.stopResize);
  };

  doResize = event => {
    const { resizing, startLeftWidth, startRightWidth, startX } = this.state;
    const { leftBox, rightBox } = this.props;

    if (resizing) {
      let diff = event.pageX - startX;

      if (leftBox) {
        leftBox.style.width = +startLeftWidth + diff + 'px';
      }

      if (rightBox) {
        rightBox.style.width = +startRightWidth - diff + 'px';
      }
    }
  };

  stopResize = event => {
    const { resizing } = this.state;

    window.removeEventListener('mousemove', this.doResize);

    if (resizing) {
      this.setState({ resizing: false, startX: 0, startLeftWidth: 0, startRightWidth: 0 });
    }
  };

  render() {
    const { className } = this.props;
    const classes = classNames('ecos-resizer-x', className);

    return (
      <div className={classes} onMouseDown={this.startResize}>
        <Icon className="ecos-resizer-x__icon icon-v_resize" />
      </div>
    );
  }
}

export default ResizerX;
