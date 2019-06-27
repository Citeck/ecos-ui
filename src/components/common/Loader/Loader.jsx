import React, { Component } from 'react';
import classNames from 'classnames';
import ReactLoader from 'react-loader-spinner';

import './Loader.scss';

export default class Loader extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('ecos-loader', props.className, {
      'ecos-loader_blur': props.blur
    });

    return (
      <div className={cssClasses}>
        <ReactLoader type="Oval" color="#7396cd" height="100" width="100" />
      </div>
    );
  }
}
