import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Droppable as DropWrapper } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
import './style.scss';

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
    isDragingOver: PropTypes.bool,
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
    isDragingOver: false,
    childPosition: 'row'
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
    const { className, isDragingOver } = this.props;
    const classes = ['ecos-dnd__droppable-wrapper'];

    if (className) {
      classes.push(className);
    }

    if (isDragingOver) {
      classes.push('ecos-dnd__droppable-wrapper_over');
    }

    return classes.join(' ');
  }

  get hasChildren() {
    const { children } = this.props;

    if (Array.isArray(children) && !children.length) {
      return false;
    }

    return children;
  }

  renderChildren(provided, snapshot) {
    const { children, placeholder, style } = this.props;
    let body = <div className="ecos-dnd__placeholder">{placeholder}</div>;

    if (this.hasChildren) {
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
  }

  render() {
    const { droppableId, direction, isDropDisabled, droppableIndex } = this.props;

    return (
      <div className={this.wrapperClassName}>
        <Scrollbars style={{ height: '100%' }} autoHide renderTrackHorizontal={props => <div {...props} hidden />}>
          <DropWrapper
            ignoreContainerClipping
            droppableId={droppableId}
            direction={direction}
            isDropDisabled={isDropDisabled}
            index={droppableIndex}
          >
            {(provided, snapshot) => this.renderChildren(provided, snapshot)}
          </DropWrapper>
        </Scrollbars>
      </div>
    );
  }
}
