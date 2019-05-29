import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Droppable as DropWrapper } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
// import PerfectScrollbar from 'react-perfect-scrollbar'
// import SimpleBar from 'simplebar-react';

import './style.scss';
// import 'react-perfect-scrollbar/dist/css/styles.css';
// import 'simplebar/dist/simplebar.min.css';

export class Droppable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    droppableIndex: PropTypes.number,
    droppableId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    placeholder: PropTypes.string,
    direction: PropTypes.string,
    isDropDisabled: PropTypes.bool,
    childPosition: PropTypes.oneOf(['column', 'row'])
  };

  static defaultProps = {
    className: '',
    children: null,
    style: {},
    placeholder: '',
    direction: 'vertical',
    isDropDisabled: false,
    droppableIndex: 0,
    childPosition: 'row'
  };

  state = {
    isDraggingOver: false,
    draggingFromThisWith: true
  };

  className() {
    const { className, childPosition } = this.props;
    const classes = ['ecos-dnd__droppable'];

    if (className) {
      classes.push(className);
    }

    if (childPosition) {
      classes.push(`ecos-dnd__droppable_${childPosition}`);
    }

    return classes.join(' ');
  }

  get wrapperClassName() {
    const { className } = this.props;
    const { isDraggingOver, draggingFromThisWith } = this.state;
    const classes = ['ecos-dnd__droppable-wrapper'];

    if (className) {
      classes.push(className);
    }

    if (isDraggingOver && !draggingFromThisWith) {
      classes.push('ecos-dnd__droppable-wrapper_over');
    }

    return classes.join(' ');
  }

  renderChildren = (provided, snapshot) => {
    const { children, placeholder, style } = this.props;
    let body = <div className="ecos-dnd__placeholder">{placeholder}</div>;

    this.setState({
      isDraggingOver: snapshot.isDraggingOver,
      draggingFromThisWith: snapshot.draggingFromThisWith
    });

    if (children) {
      body = (
        <Fragment>
          {children}
          {provided.placeholder}
        </Fragment>
      );
    }

    return (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        className={this.className(snapshot.isDraggingOver, snapshot.draggingFromThisWith)}
        style={style}
      >
        {body}
      </div>
    );
  };

  render() {
    const { droppableId, direction, isDropDisabled, droppableIndex } = this.props;

    return (
      <div className={this.wrapperClassName}>
        <Scrollbars style={{ height: '100%' }} autoHide renderTrackHorizontal={props => <div {...props} hidden />}>
          <DropWrapper droppableId={droppableId} direction={direction} isDropDisabled={isDropDisabled} index={droppableIndex}>
            {this.renderChildren}
          </DropWrapper>
        </Scrollbars>
      </div>
    );
  }
}
