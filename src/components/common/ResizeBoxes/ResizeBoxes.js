import classNames from 'classnames';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';

import Icon from '../icons/Icon/Icon';

import './style.scss';

class ResizeBoxes extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    leftId: PropTypes.string,
    rightId: PropTypes.string,
    isSimpleVertical: PropTypes.bool,
    notCountAtLeft: PropTypes.bool,
    notCountAtRight: PropTypes.bool,
    autoRightSide: PropTypes.bool,
    sizes: PropTypes.shape({
      left: PropTypes.number,
      right: PropTypes.number
    }),
    onResizeComplete: PropTypes.func
  };

  static defaultProps = {
    className: '',
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

  componentDidMount() {
    this.updateBoxesPositionOfProps();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!isEqual(prevProps.sizes, this.props.sizes)) {
      this.updateBoxesPositionOfProps();
    }
  }

  updateBoxesPositionOfProps = () => {
    const { sizes } = this.props;
    const { left, right } = sizes || {};

    if (left || right) {
      this.setState(
        {
          resizing: true,
          startX: 0,
          startLeftWidth: left || 0,
          startRightWidth: right || 0
        },
        () => {
          this.doResize({ pageX: 0 });
          this.stopResize();
        }
      );
    }
  };

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
    const { leftId, rightId, notCountAtRight, notCountAtLeft, autoRightSide } = this.props;
    const { resizing, startLeftWidth, startRightWidth, startX } = this.state;

    if (resizing) {
      const diff = event.pageX - startX;
      const leftSide = +startLeftWidth + diff + 'px';
      const rightSide = +startRightWidth - diff + 'px';

      if (leftId && !notCountAtLeft) {
        this.getElm(leftId).style.width = leftSide;
      }

      if (rightId && !notCountAtRight) {
        this.getElm(rightId).style.width = autoRightSide && !notCountAtLeft ? `calc(100% - ${leftSide})` : rightSide;
      }
    }
  };

  stopResize = event => {
    const { leftId, rightId, onResizeComplete } = this.props;
    const { resizing } = this.state;

    window.removeEventListener('mousemove', this.doResize);

    if (resizing) {
      this.setState({ resizing: false, startX: 0, startLeftWidth: 0, startRightWidth: 0 });
      isFunction(onResizeComplete) &&
        onResizeComplete({
          left: this.getElm(leftId).offsetWidth,
          right: this.getElm(rightId).offsetWidth
        });
    }
  };

  render() {
    const { className, isSimpleVertical, autoRightSide } = this.props;
    const classes = classNames('ecos-resizer-x', className, {
      'ecos-resizer-x__simple-vertical': isSimpleVertical,
      'ecos-resizer-x__simple-vertical_left': isSimpleVertical && !autoRightSide
    });

    return (
      <div className={classes} onMouseDown={this.startResize}>
        {!isSimpleVertical && <Icon className="ecos-resizer-x__icon icon-custom-resize-vertical" />}
      </div>
    );
  }
}

export default ResizeBoxes;
