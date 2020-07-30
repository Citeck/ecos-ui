import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import { Icon } from '../';

import './style.scss';

class ResizeBoxes extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    leftId: PropTypes.string,
    rightId: PropTypes.string,
    notCountAtLeft: PropTypes.bool,
    notCountAtRight: PropTypes.bool,
    onResizeComplete: PropTypes.func
  };

  static defaultProps = {
    className: '',
    notCountAtLeft: false,
    notCountAtRight: false,
    onResizeComplete: () => null
  };

  state = {
    resizing: false,
    startX: 0,
    startLeftWidth: 0,
    startRightWidth: 0
  };

  getElm(id) {
    return document.getElementById(id) || {};
  }

  startResize = event => {
    event.preventDefault();
    const { leftId, rightId } = this.props;

    this.setState({
      resizing: true,
      startX: event.pageX,
      startLeftWidth: get(this.getElm(leftId), 'offsetWidth', 0),
      startRightWidth: get(this.getElm(rightId), 'offsetWidth', 0)
    });

    window.addEventListener('mousemove', this.doResize);
    window.addEventListener('mouseup', this.stopResize);
  };

  doResize = event => {
    const { leftId, rightId, notCountAtRight, notCountAtLeft } = this.props;
    const { resizing, startLeftWidth, startRightWidth, startX } = this.state;

    if (resizing) {
      let diff = event.pageX - startX;

      if (leftId && !notCountAtLeft) {
        this.getElm(leftId).style.width = +startLeftWidth + diff + 'px';
      }

      if (rightId && !notCountAtRight) {
        this.getElm(rightId).style.width = +startRightWidth - diff + 'px';
      }
    }
  };

  stopResize = event => {
    const { resizing } = this.state;

    window.removeEventListener('mousemove', this.doResize);

    if (resizing) {
      this.setState({ resizing: false, startX: 0, startLeftWidth: 0, startRightWidth: 0 });
      this.props.onResizeComplete();
    }
  };

  render() {
    const { className } = this.props;
    const classes = classNames('ecos-resizer-x', className);

    return (
      <div className={classes} onMouseDown={this.startResize}>
        <Icon className="ecos-resizer-x__icon icon-custom-resize-vertical" />
      </div>
    );
  }
}

export default ResizeBoxes;
