import PropTypes from 'prop-types';
import * as React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import classNames from 'classnames';

import { getOptimalHeight } from '../../../helpers/layout';

export default class DefineHeight extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    querySelector: PropTypes.string,
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

  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.fixHeight !== this.props.fixHeight) {
      this.getHeights(nextProps);
    }
  }

  onResize = (w, contentHeight) => {
    this.getHeights(this.props, contentHeight);
  };

  getHeights(props, contentHeight) {
    const { fixHeight, minHeight, maxHeight, isMin } = props;
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
    const { children, className, querySelector } = this.props;

    return children ? (
      <div className={classNames('ecos-def-height__container', className)}>
        <ReactResizeDetector handleHeight onResize={this.onResize} querySelector={querySelector} />
        {children}
      </div>
    ) : null;
  }
}
