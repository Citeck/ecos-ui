import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { DefineHeight } from '../';

export default function ScrollDashletContent({
  children,
  offScroll,
  headClassName,
  contentHeight,
  fixHeight,
  minHeight,
  maxHeight,
  isMin,
  setHeight
}) {
  if (offScroll) {
    return children;
  }

  return (
    <Scrollbars
      className={`${headClassName}__scroll`}
      style={{ height: contentHeight || '100%' }}
      renderTrackVertical={props => <div {...props} className={`${headClassName}__v-scroll`} />}
    >
      <DefineHeight fixHeight={fixHeight} maxHeight={maxHeight} minHeight={minHeight} isMin={isMin} getOptimalHeight={setHeight}>
        {children}
      </DefineHeight>
    </Scrollbars>
  );
}
