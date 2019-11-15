import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import { getId, trigger } from '../../../../helpers/util';

import './DndList.scss';

const ListItem = ({ cssItemClasses, provided, item }) => {
  return (
    <li
      className={cssItemClasses}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{ ...provided.draggableProps.style }}
    >
      {item.content}
    </li>
  );
};

export default class DndList extends Component {
  constructor(props) {
    super(props);
    this._id = getId();
    this.state = {
      data: this.props.data || []
    };
    this.portal = this.createDraggableContainer();
  }

  componentDidUpdate(prevProps) {
    const props = this.props;
    if (props.data !== prevProps.data) {
      this.setState({ data: props.data });
    }
  }

  createDraggableContainer = () => {
    let div = document.createElement('div');
    document.body.appendChild(div);
    return div;
  };

  removeDraggableContainer = () => {
    document.body.removeChild(this.portal);
  };

  componentWillUnmount() {
    this.removeDraggableContainer();
  }

  view = (data, props) => {
    const tpl = this.props.tpl || (() => <span />);

    return data.map(item => ({
      id: getId(),
      content: tpl.call(this, item, props)
    }));
  };

  onDragEnd = result => {
    if (!result.destination) {
      return;
    }

    const data = this.order(this.state.data, result.source.index, result.destination.index);

    this.setState({ data });

    trigger.call(this, 'onOrder', data);
  };

  order = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  render() {
    const { className, classNameItem, draggableClassName = '', noScroll, ...props } = this.props;
    const cssClasses = classNames('ecos-dnd-list', className);
    const cssItemClasses = classNames('ecos-dnd-list__item', classNameItem);

    const list = this.view(this.state.data, props);

    const Scroll = ({ noScroll, children }) =>
      noScroll ? <Fragment>{children}</Fragment> : <Scrollbars style={{ height: '100%' }}>{children}</Scrollbars>;

    return (
      <Scroll noScroll={noScroll}>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId={this._id}>
            {provided => (
              <div>
                <ul className={cssClasses} {...provided.droppableProps} ref={provided.innerRef}>
                  {list.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => {
                        return snapshot.isDragging ? (
                          ReactDOM.createPortal(
                            <ListItem
                              cssItemClasses={snapshot.isDragging ? `${cssItemClasses} ${draggableClassName}` : cssItemClasses}
                              provided={provided}
                              item={item}
                            />,
                            this.portal
                          )
                        ) : (
                          <ListItem cssItemClasses={cssItemClasses} provided={provided} item={item} />
                        );
                      }}
                    </Draggable>
                  ))}
                </ul>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Scroll>
    );
  }
}
