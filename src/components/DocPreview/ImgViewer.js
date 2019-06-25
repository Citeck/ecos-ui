import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import fscreen from 'fscreen';
import { getScale } from '../../helpers/util';

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
      scale: 1,
      isFullscreen: false
    }
  };

  constructor(props) {
    super(props);

    this.refImg = React.createRef();
    this.refImgCtr = React.createRef();
    this.fullScreenOff = true;
    this.state = {
      calcScale: 1
    };
  }

  componentDidMount() {
    this.elImage.addEventListener('fullscreenchange', this.onFullscreenchange, false);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.settings.isFullscreen) {
      fscreen.requestFullscreen(this.elImage);
    }

    let {
      settings: { scale: newScale }
    } = nextProps;
    let {
      settings: { scale: oldScale }
    } = this.props;

    if (newScale !== oldScale) {
      let calcScale = this.getCalcScale(nextProps);

      this.setState({ calcScale });

      if (Number.isNaN(parseFloat(newScale))) {
        this.props.calcScale(calcScale);
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('fullscreenchange', this.onFullscreenchange, false);
  }

  get elImage() {
    return this.refImg.current || {};
  }

  get elContainer() {
    return this.props.refViewer.current || {};
  }

  get styleZoom() {
    let { calcScale = {} } = this.state;

    return calcScale ? { transform: `scale(${calcScale})` } : {};
  }

  getCalcScale = props => {
    let {
      settings: { scale }
    } = props;

    let { clientWidth: cW, clientHeight: cH } = this.elContainer;
    let { clientWidth: iW, clientHeight: iH } = this.elImage;

    return getScale(scale, { width: cW, height: cH }, { width: iW, height: iH });
  };

  onFullscreenchange = () => {
    this.fullScreenOff = !this.fullScreenOff;

    if (this.fullScreenOff) {
      this.props.onFullscreen(false);
    }
  };

  render() {
    const { ctrClass, urlImg } = this.props;
    const _pageCtr = `${ctrClass}__page-container`;

    return (
      <div className={classNames(_pageCtr, `${_pageCtr}_img`)} ref={this.refImgCtr}>
        <img src={urlImg} alt={urlImg} style={this.styleZoom} className={`${_pageCtr}__content`} ref={this.refImg} />
      </div>
    );
  }
}

export default ImgViewer;
