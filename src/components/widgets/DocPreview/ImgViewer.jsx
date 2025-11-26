import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Loader } from '../../common';

import { DocScaleOptions } from '@/constants';
import { getScale } from '@/helpers/util';

class ImgViewer extends Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      scale: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    }),
    refViewer: PropTypes.object,
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onError: PropTypes.func,
    onCentered: PropTypes.func
  };

  static defaultProps = {
    settings: {
      scale: 1
    }
  };

  constructor(props) {
    super(props);

    this.refImgCtr = props.forwardedRef || React.createRef();

    this.state = {
      calcScale: 1,
      imgWidth: 0,
      imgHeight: 0,
      refImage: null,
      isRefSet: false
    };
  }

  componentDidMount() {
    this.exist = true;

    if (this.elImage.addEventListener) {
      this.elImage.addEventListener('error', this.onError);
    }

    if (!!this.props.src) {
      this.preloadImage(this.props.src);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    let {
      settings: { scale: newScale },
      src: newSrc
    } = this.props;
    let {
      settings: { scale: oldScale },
      src: oldSrc
    } = prevProps;

    if (newScale !== oldScale) {
      let calcScale = this.getCalcScale(this.props);

      this.setState({ calcScale });

      if (!Number.isNaN(parseFloat(newScale))) {
        this.props.calcScale(calcScale);
      }
    }

    if (newSrc !== oldSrc) {
      this.preloadImage(newSrc);
    }
  }

  componentWillUnmount() {
    this.exist = false;

    if (this.elImage.removeEventListener) {
      this.elImage.removeEventListener('error', this.onError);
    }
  }

  setImgRef = ref => {
    if (ref) {
      this.setState({ refImage: ref }, this.setImageScale);
    }
  };

  setImageScale = () => {
    if (!this.exist) {
      return;
    }

    const { onCentered } = this.props;
    const { calcScale: currentScale } = this.state;
    const calcScale = this.getCalcScale();

    if (currentScale !== calcScale) {
      this.setState({ calcScale });
    }

    isFunction(onCentered) && onCentered();
  };

  get elImage() {
    const element = this.state.refImage;

    return isEmpty(element) ? {} : element;
  }

  get elContainer() {
    const element = get(this.props, 'refViewer.current');

    return isEmpty(element) ? {} : element;
  }

  get isCentered() {
    const {
      settings: { scale }
    } = this.props;

    const scales = [DocScaleOptions.AUTO, DocScaleOptions.PAGE_WIDTH];

    const imageWidth = get(this.state.refImage, 'offsetWidth', 0);
    const imageHeight = get(this.state.refImage, 'offsetHeight', 0);

    if (imageWidth && imageHeight && imageWidth < imageHeight) {
      scales.push(DocScaleOptions.PAGE_FIT, DocScaleOptions.PAGE_HEIGHT);
    }

    return scales.includes(scale);
  }

  get styleZoom() {
    const { calcScale = {} } = this.state;
    const wrapper = get(this.refImgCtr, 'current');
    const styles = {};

    if (calcScale) {
      styles.transform = `scale(${calcScale})`;
    }

    if (wrapper) {
      wrapper.style.textAlign = 'unset';
    }

    styles.transformOrigin = 'center';

    if (!this.isCentered) {
      styles.transformOrigin = 'top left';
    }

    if (calcScale <= 1) {
      const imageWidth = get(this.state.refImage, 'offsetWidth', 0);

      if (wrapper && wrapper.offsetWidth > imageWidth) {
        wrapper.style.textAlign = 'center';
      }
    }

    return styles;
  }

  onError = error => {
    this.exist && isFunction(this.props.onError) && this.props.onError(error);
  };

  onUpdate() {
    const calcScale = this.getCalcScale(this.props);

    if (this.state.calcScale !== calcScale) {
      this.setState({ calcScale });
    }
  }

  preloadImage = src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (this.exist) {
        this.setState(
          {
            imgWidth: img.width,
            imgHeight: img.height
          },
          this.setImageScale
        );
      }
    };
    img.onerror = this.onError;
  };

  getCalcScale = (props = this.props) => {
    const {
      settings: { scale }
    } = props;
    const { clientWidth: cW, clientHeight: cH } = this.elContainer;
    const { clientWidth: iWOrigin, clientHeight: iHOrigin } = this.elImage;
    const { imgWidth: iWPreload, imgHeight: iHPreload } = this.state;

    const iW = !(iWOrigin && iHOrigin) ? iWPreload : iWOrigin;
    const iH = !(iWOrigin && iHOrigin) ? iHPreload : iHOrigin;

    if (iW && iH) {
      this.setState({ isRefSet: true });
    }

    if (!(cW && cH && iW && iH) || isNil(scale)) {
      return 1;
    }

    switch (scale) {
      case DocScaleOptions.AUTO: {
        const width = Math.min(cW, iW);
        const height = Math.min(cH, iH);

        return Math.min(+(width / iW).toFixed(2), +(height / iH).toFixed(2));
      }
      default:
        return getScale(scale, { width: cW, height: cH }, { origW: iW, origH: iH });
    }
  };

  renderLoader() {
    const { isRefSet } = this.state;

    return !isRefSet && <Loader blur />;
  }

  render() {
    const { src } = this.props;
    const { isRefSet } = this.state;

    const Loader = this.renderLoader();

    return (
      <div
        className={classNames('ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_img', {
          'ecos-doc-preview__viewer-page_center': this.isCentered
        })}
        ref={this.refImgCtr}
      >
        {Loader}
        {!!src && (
          <img
            hidden={!isRefSet}
            src={src}
            alt={src}
            className="ecos-doc-preview__viewer-page-content ecos-doc-preview__viewer-page-content_img"
            style={this.styleZoom}
            ref={this.setImgRef}
            onError={this.onError}
            onLoad={this.setImageScale}
          />
        )}
      </div>
    );
  }
}

export default ImgViewer;
