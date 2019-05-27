import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Droppable as DropWrapper } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
import './style.scss';

export default class Droppable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string
  };

  static defaultProps = {
    className: '',
    children: null,
    style: {},
    placeholder: ''
  };

  className(isDraggingOver = false, draggingFromThisWith = false) {
    const { className } = this.props;
    const classes = ['ecos-dnd__droppable'];

    if (className) {
      classes.push(className);
    }

    if (isDraggingOver && !draggingFromThisWith) {
      classes.push('ecos-dnd__droppable_over');
    }

    return classes.join(' ');
  }

  renderChildrens = () => {
    const { children, style, placeholder } = this.props;
    const renderView = props => <div {...props} className={classNames(`${this._className}__scrollbar`)} />;
    const renderTrackHorizontal = props => <div {...props} hidden />;

    if (children) {
      return (
        <Scrollbars renderView={renderView} renderTrackHorizontal={renderTrackHorizontal} style={style}>
          {children}
        </Scrollbars>
      );
    }

    return <div className="ecos-dnd__placeholder">{placeholder}</div>;
  };

  render() {
    const { id } = this.props;

    return (
      <DropWrapper droppableId={id}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} className={this.className(snapshot.isDraggingOver, snapshot.draggingFromThisWith)}>
            <React.Fragment>
              {this.renderChildrens()}
              {provided.placeholder}
            </React.Fragment>
          </div>
        )}
      </DropWrapper>
    );
  }
}
