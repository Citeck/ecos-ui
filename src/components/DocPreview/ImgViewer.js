import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { openFullscreen, getScale } from '../../helpers/util';

class ImgViewer extends Component {
  static propTypes = {
    ctrClass: PropTypes.string.isRequired,
    urlImg: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool
    }),
    refViewer: PropTypes.object
  };

  static defaultProps = {
    settings: {
      scale: 0,
      isFullscreen: false
    }
  };

  refImg = React.createRef();
  refImgCtr = React.createRef();

  componentWillReceiveProps(nextProps) {
    if (nextProps.settings.isFullscreen) {
      openFullscreen(this.elImage);
    }
  }

  get elImage() {
    return this.refImg.current || {};
  }

  get elContainer() {
    return this.props.refViewer.current || {};
  }

  get zoom() {
    let {
      settings: { scale }
    } = this.props;

    let { clientWidth: cW, clientHeight: cH } = this.elContainer;
    let { clientWidth: iW, clientHeight: iH } = this.elImage;

    scale = getScale(scale, { width: cW, height: cH }, { width: iW, height: iH });

    return scale ? { transform: `scale(${scale})` } : {};
  }

  render() {
    let { ctrClass, urlImg } = this.props;
    let _pageCtr = `${ctrClass}__page-container`;

    return (
      <div className={_pageCtr} ref={this.refImgCtr}>
        <img src={urlImg} alt={urlImg} style={this.zoom} className={`${_pageCtr}__content`} ref={this.refImg} />
      </div>
    );
  }
}

export default ImgViewer;
