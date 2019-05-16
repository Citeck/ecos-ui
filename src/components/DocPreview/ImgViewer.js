import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { openFullscreen } from '../../helpers/util';

class ImgViewer extends Component {
  static propTypes = {
    ctrClass: PropTypes.string.isRequired,
    urlImg: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool
    })
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
    let newW = 'auto',
      newH = 'auto';
    let ctrW = this.elContainer.clientWidth;
    let ctrH = this.elContainer.clientHeight;

    switch (scale) {
      case 'page-height':
        newH = ctrH;
        break;
      case 'page-width':
        newW = ctrW;
        break;
      case 'page-fit':
        if (Math.min(ctrH, ctrW) === ctrH) {
          newH = ctrH;
        } else {
          newW = ctrW;
        }
        break;
      case 'auto':
        if (Math.min(ctrH, ctrW) === ctrH) {
          newH = ctrH - 50;
        } else {
          newW = ctrW - 50;
        }
        break;
      default:
        if (!Number.isNaN(parseFloat(scale))) {
          newW = ctrW * scale;
        }
    }

    return scale ? { transform: `scale(${scale})` } : {};
    // return { height: newH, width: newW };
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
