import React from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import './style.scss';
import DragItem from '../DragItem';

class SelectWidgets extends React.Component {
  _className = 'ecos-select-widgets';

  renderView = props => <div {...props} className={classNames(`${this._className}__scrollbar`)} />;
  renderTrackHorizontal = props => <div {...props} hidden />;

  render() {
    const arr = new Array(50);
    arr.fill('item');

    return (
      <div className={`${this._className}`}>
        <Scrollbars renderView={this.renderView} renderTrackHorizontal={this.renderTrackHorizontal}>
          {arr.map(item => (
            <DragItem title={item} />
          ))}
        </Scrollbars>
      </div>
    );
  }
}

export default SelectWidgets;
