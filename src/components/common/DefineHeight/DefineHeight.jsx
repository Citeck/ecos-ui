import PropTypes from 'prop-types';
import * as React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import classNames from 'classnames';

import { getOptimalHeight } from '../../../helpers/layout';

export default class DefineHeight extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    fixHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isMin: PropTypes.bool,
    getOptimalHeight: PropTypes.func,
    getContentHeight: PropTypes.func
  };

  static defaultProps = {
    isMin: false,
    className: '',
    getOptimalHeight: () => null,
    getContentHeight: () => null
  };

  state = {
    contentHeight: 0,
    optimalHeight: 0
  };

  componentDidUpdate(prevProps) {
    if (
      prevProps.fixHeight !== this.props.fixHeight ||
      prevProps.minHeight !== this.props.minHeight ||
      prevProps.maxHeight !== this.props.maxHeight
    ) {
      this.getHeights();
    }
  }

  onResize = (w, contentHeight) => {
    !!contentHeight && this.getHeights(contentHeight);
  };

  getHeights(contentHeight) {
    const { fixHeight, minHeight, maxHeight, isMin } = this.props;
    const optimalHeight = getOptimalHeight(fixHeight, contentHeight, minHeight, maxHeight, isMin);

    this.setState(prevState => {
      if (prevState.optimalHeight !== optimalHeight) {
        this.props.getOptimalHeight(optimalHeight);
        this.props.getContentHeight(fixHeight || contentHeight);

        return { contentHeight, optimalHeight };
      }
    });
  }

  render() {
    const { children, className, ...detectorProps } = this.props;

    return children ? (
      <div className={classNames('ecos-def-height__container', className)}>
        <ReactResizeDetector handleHeight onResize={this.onResize} {...detectorProps} />
        {children}
      </div>
    ) : null;
  }
}
