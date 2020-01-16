import React, { Component } from 'react';
import PropTypes from 'prop-types';
import fscreen from 'fscreen';

import { getScale } from '../../../helpers/util';

class ImgViewer extends Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isFullscreen: PropTypes.bool
    }),
    refViewer: PropTypes.object,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onError: PropTypes.func
  };

  static defaultProps = {
    settings: {
      scale: 1,
      isFullscreen: false
    }
  };

  constructor(props) {
    super(props);

    this.refImgCtr = props.forwardedRef || React.createRef();
    this.refImg = React.createRef();
    this.fullScreenOff = true;

    this.state = {
      calcScale: 1
    };
  }

  componentDidMount() {
    this.elImage.addEventListener('fullscreenchange', this.onFullscreenchange, false);

    if (this.props.onError) {
      this.elImage.onerror = this.props.onError;
    }
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
    const { src } = this.props;
    const style = { width: this.elImage.offsetWidth || 0 };

    return (
      <div className="ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_img" ref={this.refImgCtr} style={style}>
        <img src={src} alt={src} style={this.styleZoom} className="ecos-doc-preview__viewer-page-content" ref={this.refImg} />
      </div>
    );
  }
}

export default ImgViewer;
