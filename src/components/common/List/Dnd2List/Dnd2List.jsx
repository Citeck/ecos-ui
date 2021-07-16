import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
import { getId, trigger } from '../../../../helpers/util';
import Columns from '../../templates/Columns/Columns';

import './Dnd2List.scss';

const ListItem = React.memo(({ cssItemClasses, provided, item }) => {
  return (
    <span
      className={cssItemClasses}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{ ...provided.draggableProps.style }}
    >
      {item.content}
    </span>
  );
});

const Dnd = React.memo(({ data, cssClasses, cssItemClasses, id, portal, draggableClassName }) => {
  return (
    <div className={'ecos-dnd2-list__column'}>
      <Scrollbars style={{ height: '100%' }}>
        <Droppable droppableId={id}>
          {provided => (
            <div className={data.length > 3 ? '' : 'ecos-dnd2-list__placeholder_full'}>
              <div className={cssClasses} {...provided.droppableProps} ref={provided.innerRef}>
                {data.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => {
                      return snapshot.isDragging ? (
                        ReactDOM.createPortal(
                          <ListItem
                            cssItemClasses={snapshot.isDragging ? `${cssItemClasses} ${draggableClassName}` : cssItemClasses}
                            provided={provided}
                            item={item}
                          />,
                          portal
                        )
                      ) : (
                        <ListItem cssItemClasses={cssItemClasses} provided={provided} item={item} />
                      );
                    }}
                  </Draggable>
                ))}
              </div>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </Scrollbars>
    </div>
  );
});

export default class Dnd2List extends Component {
  constructor(props) {
    super(props);

    this.portal = this.createDraggableContainer();

    this._firstId = getId();
    this._secondId = getId();

    this.id2List = {
      [this._firstId]: 'first',
      [this._secondId]: 'second'
    };

    this.state = {
      first: this.props.first || [],
      second: this.props.second || []
    };
  }

  componentDidUpdate(prevProps) {
    const props = this.props;

    if (props.first !== prevProps.first) {
      this.setState({ first: props.first });
    }

    if (props.second !== prevProps.second) {
      this.setState({ second: props.second });
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

  view = data => {
    const tpl = this.props.tpl || (() => <span />);

    return data.map(item => ({
      id: getId(),
      content: tpl.call(this, item)
    }));
  };

  order = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
  };

  getList = id => this.state[this.id2List[id]];

  onDragEnd = result => {
    let state = { ...this.state };
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const sourceState = this.id2List[source.droppableId];
    const destinationState = this.id2List[destination.droppableId];

    if (source.droppableId === destination.droppableId) {
      state[sourceState] = this.order(this.getList(source.droppableId), source.index, destination.index);

      this.setState(state);
    } else {
      const moved = this.move(this.getList(source.droppableId), this.getList(destination.droppableId), source, destination);

      state[sourceState] = moved[source.droppableId];
      state[destinationState] = moved[destination.droppableId];

      this.setState(state);

      trigger.call(this, 'onMove', state);
    }

    trigger.call(this, 'onOrder', state);
  };

  render() {
    const { className, classNameItem, draggableClassName = '' } = this.props;
    const cssClasses = classNames('ecos-dnd2-list', className);
    const cssItemClasses = classNames('ecos-dnd2-list__item', classNameItem);

    const first = this.view(this.state.first);
    const second = this.view(this.state.second);

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Columns
          cols={[
            <Dnd
              data={first}
              cssClasses={cssClasses}
              cssItemClasses={cssItemClasses}
              id={this._firstId}
              portal={this.portal}
              draggableClassName={draggableClassName}
            />,
            <Dnd
              data={second}
              cssClasses={cssClasses}
              cssItemClasses={cssItemClasses}
              id={this._secondId}
              portal={this.portal}
              draggableClassName={draggableClassName}
            />
          ]}
        />
      </DragDropContext>
    );
  }
}
