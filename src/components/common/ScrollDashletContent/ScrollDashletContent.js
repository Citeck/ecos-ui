import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { DefineHeight } from '../';
import PropTypes from 'prop-types';

export default function ScrollDashletContent(props) {
  const { children, offScroll, headClassName, contentHeight, ...propsDefineHeight } = props;
  if (offScroll) {
    return children;
  }

  return (
    <Scrollbars
      className={`${headClassName}__scroll`}
      style={{ height: contentHeight || '100%' }}
      renderTrackVertical={props => <div {...props} className={`${headClassName}__v-scroll`} />}
    >
      <DefineHeight {...propsDefineHeight}>{children}</DefineHeight>
    </Scrollbars>
  );
}

ScrollDashletContent.propTypes = {
  offScroll: PropTypes.bool,
  isMin: PropTypes.bool,
  headClassName: PropTypes.string,
  contentHeight: PropTypes.number,
  fixHeight: PropTypes.number,
  minHeight: PropTypes.number,
  maxHeight: PropTypes.number,
  getOptimalHeight: PropTypes.func,
  getContentHeight: PropTypes.func
};
