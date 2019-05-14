import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ImgViewer extends Component {
  static propTypes = {
    ctrClass: PropTypes.string.isRequired,
    urlImg: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      paramsZoom: PropTypes.shape({
        height: PropTypes.string,
        width: PropTypes.string
      }),
      isFullscreen: PropTypes.bool
    })
  };

  static defaultProps = {
    settings: {
      paramsZoom: {},
      isFullscreen: false
    }
  };

  refImg = React.createRef();

  componentWillReceiveProps(nextProps) {
    if (nextProps.settings.isFullscreen) {
      let elem = this.refImg.current;

      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    }
  }

  render() {
    let { ctrClass, urlImg, settings } = this.props;
    let { paramsZoom } = settings;

    let _pageCtr = `${ctrClass}__page-container`;

    return (
      <div className={_pageCtr} style={paramsZoom}>
        <img src={`${urlImg}`} alt="" height="100%" className={`${_pageCtr}__content`} ref={this.refImg} />
      </div>
    );
  }
}

export default ImgViewer;
