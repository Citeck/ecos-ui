import React from 'react';
import PropTypes from 'prop-types';
import { Droppable as DropWrapper } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';

import './style.scss';

class Droppable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    classNameView: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    droppableIndex: PropTypes.number,
    droppableId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    placeholder: PropTypes.string,
    direction: PropTypes.string,
    isDropDisabled: PropTypes.bool,
    isDragingOver: PropTypes.bool,
    isWrapper: PropTypes.bool,
    withoutScroll: PropTypes.bool,
    autoHeight: PropTypes.bool,
    childPosition: PropTypes.oneOf(['column', 'row']),
    scrollHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    classNameView: '',
    children: null,
    style: {},
    placeholder: '',
    direction: 'vertical',
    isDropDisabled: false,
    droppableIndex: 0,
    isDragingOver: false,
    isWrapper: false,
    withoutScroll: false,
    autoHeight: false,
    childPosition: 'row',
    scrollHeight: 200
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

  renderScroll(children) {
    const { withoutScroll, scrollHeight, autoHeight, classNameView } = this.props;

    if (withoutScroll) {
      return children;
    }

    const additionalParams = {};
    const style = {};

    if (autoHeight) {
      additionalParams.autoHeight = true;
      additionalParams.autoHeightMin = 40;
      additionalParams.autoHeightMax = scrollHeight;
    } else {
      style.height = typeof scrollHeight === 'string' ? scrollHeight : `${scrollHeight}px`;
    }

    return (
      <Scrollbars
        style={style}
        autoHide
        renderView={props => <div {...props} className={classNameView} />}
        renderTrackHorizontal={props => <div {...props} hidden />}
        renderThumbHorizontal={props => <div {...props} hidden />}
        {...additionalParams}
      >
        {children}
      </Scrollbars>
    );
  }

  renderChildren(provided, snapshot) {
    const { children, placeholder, style } = this.props;
    let body = (
      <div className="ecos-dnd__placeholder-wrapper">
        <div className="ecos-dnd__placeholder">{placeholder}</div>
      </div>
    );

    if (this.hasChildren) {
      body = (
        <>
          {children}
          {provided.placeholder}
        </>
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
        {this.renderScroll(
          <DropWrapper
            ignoreContainerClipping
            droppableId={droppableId}
            direction={direction}
            isDropDisabled={isDropDisabled}
            index={droppableIndex}
          >
            {(provided, snapshot) => this.renderChildren(provided, snapshot)}
          </DropWrapper>
        )}
      </div>
    );
  }
}

class Wrapper extends Droppable {
  get wrapperClassName() {
    const { className, isDragingOver } = this.props;
    const classes = [];

    if (className) {
      classes.push(className);
    }

    if (isDragingOver) {
      classes.push('ecos-dnd__droppable-wrapper_over');
    }

    return classes.join(' ');
  }

  renderChildren(provided, snapshot) {
    const { children } = this.props;

    return (
      <div
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        ref={provided.innerRef}
        className="ecos-dnd__droppable-children-wrapper"
      >
        {children}
        {provided.placeholder}
      </div>
    );
  }

  render() {
    const { droppableId, direction, isDropDisabled, droppableIndex, style } = this.props;

    return (
      <div className={this.wrapperClassName} style={style}>
        {this.renderScroll(
          <DropWrapper
            ignoreContainerClipping
            droppableId={droppableId}
            direction={direction}
            isDropDisabled={isDropDisabled}
            index={droppableIndex}
          >
            {(provided, snapshot) => this.renderChildren(provided, snapshot)}
          </DropWrapper>
        )}
      </div>
    );
  }
}

export default function(props) {
  if (props.isWrapper) {
    return <Wrapper {...props} />;
  }

  return <Droppable {...props} />;
}
