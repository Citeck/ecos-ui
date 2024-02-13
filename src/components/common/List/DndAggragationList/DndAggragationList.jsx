import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Scrollbars } from 'react-custom-scrollbars';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';

import { getId } from '../../../../helpers/util';
import AggregationListItem from '../../../ColumnsSetup/AggregationListItem';

import './DndAggragationList.scss';

const Scroll = React.memo(({ noScroll, children }) =>
  noScroll ? children : <Scrollbars style={{ height: '100%' }}>{children}</Scrollbars>
);
const ListItemWrapper = React.memo(({ cssItemClasses, provided, children }) => {
  return (
    <span
      className={cssItemClasses}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={provided.draggableProps.style}
    >
      {children}
    </span>
  );
});

export default class DndAggregationList extends Component {
  constructor(props) {
    super(props);

    this._id = getId();
    this.state = { data: props.data || [] };
    this.portal = this.createDraggableContainer();
  }

  componentDidUpdate(prevProps) {
    const { data = [] } = this.props;

    if (data.length !== get(prevProps, 'data.length', 0) && !isEqual(data, prevProps.data)) {
      this.setState({ data });
    }
  }

  componentWillUnmount() {
    this.removeDraggableContainer();
  }

  createDraggableContainer = () => {
    const div = document.createElement('div');

    document.body.appendChild(div);

    return div;
  };

  removeDraggableContainer = () => {
    document.body.removeChild(this.portal);
  };

  onDragEnd = result => {
    if (!result.destination) {
      return;
    }

    const { onOrder } = this.props;
    const data = this.order(this.state.data, result.source.index, result.destination.index);

    this.setState({ data });

    if (typeof onOrder === 'function') {
      onOrder(data);
    }
  };

  order = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);

    result.splice(endIndex, 0, removed);

    return result;
  };

  render() {
    const {
      className,
      classNameItem,
      draggableClassName = '',
      noScroll,
      metaRecord,
      sortBy,
      titleField,
      onChangeVisible,
      onChangeSortBy,
      defaultPredicates,
      columns
    } = this.props;
    const { data } = this.state;
    const cssClasses = classNames('ecos-dnd-list', className);
    const cssItemClasses = classNames('ecos-dnd-aggregation-list__item', classNameItem);

    return (
      <Scroll noScroll={noScroll}>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId={this._id}>
            {provided => (
              <div className={cssClasses} {...provided.droppableProps} ref={provided.innerRef}>
                {data.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => {
                      return snapshot.isDragging ? (
                        ReactDOM.createPortal(
                          <ListItemWrapper
                            cssItemClasses={snapshot.isDragging ? `${cssItemClasses} ${draggableClassName}` : cssItemClasses}
                            provided={provided}
                          >
                            <AggregationListItem
                              metaRecord={metaRecord}
                              column={item}
                              sortBy={sortBy}
                              titleField={titleField}
                              onChangeVisible={onChangeVisible}
                              onChangeSortBy={onChangeSortBy}
                              columns={columns}
                              defaultPredicates={defaultPredicates}
                            />
                          </ListItemWrapper>,
                          this.portal
                        )
                      ) : (
                        <ListItemWrapper
                          cssItemClasses={snapshot.isDragging ? `${cssItemClasses} ${draggableClassName}` : cssItemClasses}
                          provided={provided}
                        >
                          <AggregationListItem
                            metaRecord={metaRecord}
                            column={item}
                            sortBy={sortBy}
                            titleField={titleField}
                            onChangeVisible={onChangeVisible}
                            onChangeSortBy={onChangeSortBy}
                            columns={columns}
                            defaultPredicates={defaultPredicates}
                          />
                        </ListItemWrapper>
                      );
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Scroll>
    );
  }
}
