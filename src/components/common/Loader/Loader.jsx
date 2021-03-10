import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactLoader from 'react-loader-spinner';

import PointsLoader from '../PointsLoader/PointsLoader';

import './Loader.scss';

export default class Loader extends Component {
  static propTypes = {
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    zIndex: PropTypes.number,
    className: PropTypes.string,
    color: PropTypes.oneOf(['white', 'light-blue']),
    type: PropTypes.oneOf(['circle', 'points']),
    blur: PropTypes.bool,
    darkened: PropTypes.bool,
    rounded: PropTypes.bool,
    style: PropTypes.object
  };

  static defaultProps = {
    height: 45,
    width: 45,
    zIndex: null,
    className: '',
    color: 'light-blue',
    type: 'circle',
    blur: false,
    darkened: false,
    rounded: false
  };

  get style() {
    const { zIndex, style: propStyle } = this.props;
    const style = {};

    if (zIndex !== null) {
      style.zIndex = zIndex;
    }

    return { ...style, ...propStyle };
  }

  render() {
    const { height, width, type, color } = this.props;

    if (type === 'points') {
      return <PointsLoader color={color} width={width} height={height} />;
    }

    const { className, blur, darkened, rounded } = this.props;
    const cssClasses = classNames('ecos-loader', className, {
      'ecos-loader_blur': blur,
      'ecos-loader_darkened': darkened,
      'ecos-loader_rounded': rounded
    });

    return (
      <div className={cssClasses} style={this.style}>
        <ReactLoader type="Oval" color="#7396cd" height={height} width={width} />
      </div>
    );
  }
}
