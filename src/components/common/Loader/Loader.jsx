import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import ReactLoader from 'react-loader-spinner';

import './Loader.scss';

export default class Loader extends Component {
  static propTypes = {
    height: PropTypes.number,
    width: PropTypes.number,
    className: PropTypes.string,
    blur: PropTypes.bool,
    darkened: PropTypes.bool
  };

  static defaultProps = {
    height: 45,
    width: 45,
    className: '',
    blur: false,
    darkened: false
  };

  render() {
    const { className, blur, darkened, height, width } = this.props;
    const cssClasses = classNames('ecos-loader', className, {
      'ecos-loader_blur': blur,
      'ecos-loader_darkened': darkened
    });

    return (
      <div className={cssClasses}>
        <ReactLoader type="Oval" color="#7396cd" height={height} width={width} />
      </div>
    );
  }
}
