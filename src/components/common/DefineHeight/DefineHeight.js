import PropTypes from 'prop-types';
import * as React from 'react';
import ReactResizeDetector from 'react-resize-detector';
import { getOptimalHeight } from '../../../helpers/layout';

export default class DefineHeight extends React.Component {
  static propTypes = {
    fixHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isMin: PropTypes.bool,
    getHeight: PropTypes.func
  };

  static defaultProps = {
    isMin: false,
    getHeight: () => null
  };

  onResize = (w, contentHeight) => {
    const { fixHeight, minHeight, maxHeight, isMin, getHeight } = this.props;
    const h = getOptimalHeight(fixHeight, contentHeight, minHeight, maxHeight, isMin);

    getHeight(h);
  };

  render() {
    const { children } = this.props;
    return children ? (
      <div className={'ecos-def-height__container'}>
        <ReactResizeDetector handleHeight onResize={this.onResize} />
        {children}
      </div>
    ) : null;
  }
}
