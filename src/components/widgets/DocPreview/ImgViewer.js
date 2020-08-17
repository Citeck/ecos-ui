import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { getScale } from '../../../helpers/util';

class ImgViewer extends Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    refViewer: PropTypes.object,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onError: PropTypes.func
  };

  static defaultProps = {
    settings: {
      scale: 1
    }
  };

  constructor(props) {
    super(props);

    this.refImgCtr = props.forwardedRef || React.createRef();
    this.refImg = React.createRef();

    this.state = {
      calcScale: 1
    };
  }

  componentDidMount() {
    if (this.elImage.addEventListener) {
      this.elImage.addEventListener('error', this.onError);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    let {
      settings: { scale: newScale }
    } = this.props;
    let {
      settings: { scale: oldScale }
    } = prevProps;

    if (newScale !== oldScale) {
      let calcScale = this.getCalcScale(this.props);

      this.setState({ calcScale });

      if (!Number.isNaN(parseFloat(newScale))) {
        this.props.calcScale(calcScale);
      }
    }
  }

  componentWillUnmount() {
    if (this.elImage.removeEventListener) {
      this.elImage.removeEventListener('error', this.onError);
    }
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

  onError = error => {
    this.props.onError && this.props.onError(error);
  };

  getCalcScale = props => {
    let {
      settings: { scale }
    } = props;

    let { clientWidth: cW, clientHeight: cH } = this.elContainer;
    let { clientWidth: iW, clientHeight: iH } = this.elImage;

    return getScale(scale, { width: cW, height: cH }, { width: iW, height: iH });
  };

  render() {
    const { src } = this.props;
    const style = { width: this.elImage.offsetWidth || '100%' };

    return (
      <div className="ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_img" style={style} ref={this.refImgCtr}>
        <img
          src={src}
          alt={src}
          className="ecos-doc-preview__viewer-page-content"
          style={this.styleZoom}
          ref={this.refImg}
          onError={this.onError}
        />
      </div>
    );
  }
}

export default ImgViewer;
