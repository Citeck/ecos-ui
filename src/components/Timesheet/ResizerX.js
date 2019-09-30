import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../common';

import './style.scss';

class ResizerX extends React.Component {
  static propTypes = {
    leftBox: PropTypes.any,
    rightBox: PropTypes.any
  };

  static defaultProps = {};

  state = {
    resizing: false,
    startX: 0
  };

  startResize = event => {
    event.preventDefault();
    this.setState({ resizing: true, startX: event.pageX });

    window.addEventListener('mousemove', this.doResize);
    window.addEventListener('mouseup', this.stopResize);
  };

  doResize = event => {
    const { resizing, startX } = this.state;
    const { leftBox, rightBox } = this.props;

    if (resizing) {
      let diff = event.pageX - startX;

      this.setState({ startX: event.pageX }, () => {
        const lw = leftBox.offsetWidth;
        leftBox.style.width = +lw + +diff + 'px';

        const rw = rightBox.offsetWidth;
        rightBox.style.width = +rw - +diff + 'px';
      });
    }
  };

  stopResize = event => {
    const { resizing } = this.state;

    window.removeEventListener('mousemove', this.doResize);

    if (resizing) {
      this.setState({ resizing: false, startX: 0 });
    }
  };

  render() {
    return (
      <div className="ecos-timesheet__resizer" onMouseDown={this.startResize}>
        <Icon className="ecos-timesheet__resizer-icon icon-hamburger-menu" />
      </div>
    );
  }
}

export default ResizerX;
