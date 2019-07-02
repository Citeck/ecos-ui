import React, { Component } from 'react';
import classNames from 'classnames';
import ReactLoader from 'react-loader-spinner';

import './Loader.scss';

export default class Loader extends Component {
  render() {
    const { className, blur, height = '100', width = '100' } = this.props;
    const cssClasses = classNames('ecos-loader', className, {
      'ecos-loader_blur': blur
    });

    return (
      <div className={cssClasses}>
        <ReactLoader type="Oval" color="#7396cd" height={height} width={width} />
      </div>
    );
  }
}
