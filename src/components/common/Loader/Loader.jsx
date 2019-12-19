import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactLoader from 'react-loader-spinner';

import PointsLoader from '../PointsLoader/PointsLoader';

import './Loader.scss';

export default class Loader extends Component {
  static propTypes = {
    height: PropTypes.number,
    width: PropTypes.number,
    className: PropTypes.string,
    color: PropTypes.oneOf(['white', 'light-blue']),
    type: PropTypes.oneOf(['circle', 'points']),
    blur: PropTypes.bool,
    darkened: PropTypes.bool,
    rounded: PropTypes.bool
  };

  static defaultProps = {
    height: 45,
    width: 45,
    className: '',
    color: 'light-blue',
    type: 'circle',
    blur: false,
    darkened: false,
    rounded: false
  };

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
      <div className={cssClasses}>
        <ReactLoader type="Oval" color="#7396cd" height={height} width={width} />
      </div>
    );
  }
}
