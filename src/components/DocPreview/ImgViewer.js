import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class ImgViewer extends Component {
  static propTypes = {
    ctrClass: PropTypes.string.isRequired,
    urlImg: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      paramsZoom: PropTypes.shape({
        height: PropTypes.string,
        width: PropTypes.string
      })
    })
  };

  static defaultProps = {
    settings: {
      paramsZoom: {}
    }
  };

  componentWillReceiveProps(nextProps) {
    // console.log('nextProps', nextProps)
  }

  render() {
    let { ctrClass, urlImg, settings } = this.props;
    let { paramsZoom } = settings;

    let _pageCtr = `${ctrClass}__page-container`;

    return (
      <div className={_pageCtr} style={paramsZoom}>
        <img src={`${urlImg}`} alt="image" height="100%" className={`${_pageCtr}__content`} />
      </div>
    );
  }
}

export default ImgViewer;
