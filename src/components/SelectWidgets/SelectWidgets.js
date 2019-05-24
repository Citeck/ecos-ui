import React from 'react';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import './style.scss';
import DragItem from '../DragItem';
import PropTypes from 'prop-types';

class SelectWidgets extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    )
  };

  static defaultProps = {
    className: '',
    items: []
  };

  _className = 'ecos-select-widgets';

  renderDragItem() {
    const { items } = this.props;

    if (!items || (items && !items.length)) {
      return null;
    }

    return items.map((item, index) => {
      const { title } = item;

      return <DragItem title={title} />;
    });
  }

  renderView = props => <div {...props} className={classNames(`${this._className}__scrollbar`)} />;
  renderTrackHorizontal = props => <div {...props} hidden />;

  render() {
    const { className } = this.props;

    return (
      <div className={`${this._className} ${className}`}>
        <Scrollbars renderView={this.renderView} renderTrackHorizontal={this.renderTrackHorizontal}>
          {this.renderDragItem()}
        </Scrollbars>
      </div>
    );
  }
}

export default SelectWidgets;
