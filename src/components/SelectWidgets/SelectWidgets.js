import React from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import DragItem from '../DragItem';

import './style.scss';

class SelectWidgets extends React.Component {
  render() {
    let baseClass = 'ecos-select-widgets';
    const renderView = props => <div {...props} className={classNames(`${baseClass}__scrollbar`)} />;
    const renderTrackHorizontal = props => <div {...props} hidden />;

    return (
      <div className={`${baseClass}`}>
        <Scrollbars renderView={renderView} renderTrackHorizontal={renderTrackHorizontal}>
          <DragItem />
          <DragItem />
          <DragItem />
          <DragItem />
        </Scrollbars>
      </div>
    );
  }
}

export default SelectWidgets;
