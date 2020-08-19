import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { getScale } from '../../../helpers/util';
import { DocScaleOptions } from '../../../constants';

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

  _imageRef = null;

  constructor(props) {
    super(props);

    this.refImgCtr = props.forwardedRef || React.createRef();

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

  setImgRef = ref => {
    if (ref) {
      this._imageRef = ref;
      this.setImageScale();
    }
  };

  setImageScale = () => {
    const calcScale = this.getCalcScale();

    if (this.state.calcScale !== calcScale) {
      this.setState({ calcScale });
    }
  };

  get elImage() {
    const element = this._imageRef;

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
    const scales = [DocScaleOptions.PAGE_HEIGHT, DocScaleOptions.AUTO, DocScaleOptions.PAGE_FIT, DocScaleOptions.PAGE_WIDTH];

    if (typeof scale === 'number') {
      return true;
    }

    return scales.includes(scale);
  }

  get styleZoom() {
    const { calcScale = {} } = this.state;
    const styles = {};

    if (calcScale) {
      styles.transform = `scale(${calcScale})`;
    }

    return styles;
  }

  onError = error => {
    this.props.onError && this.props.onError(error);
  };

  onUpdate() {
    const calcScale = this.getCalcScale(this.props);

    if (this.state.calcScale !== calcScale) {
      this.setState({ calcScale });
    }
  }

  getCalcScale = (props = this.props) => {
    const {
      settings: { scale }
    } = props;
    const { clientWidth: cW, clientHeight: cH } = this.elContainer;
    const { clientWidth: iW, clientHeight: iH } = this.elImage;

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

  render() {
    const { src } = this.props;

    return (
      <div
        className={classNames('ecos-doc-preview__viewer-page ecos-doc-preview__viewer-page_img', {
          'ecos-doc-preview__viewer-page_center': this.isCentered
        })}
        ref={this.refImgCtr}
      >
        <img
          src={src}
          alt={src}
          className="ecos-doc-preview__viewer-page-content"
          style={this.styleZoom}
          ref={this.setImgRef}
          onError={this.onError}
          onLoad={this.setImageScale}
        />
      </div>
    );
  }
}

export default ImgViewer;
