import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';

import { getMinWidthColumn } from '../../helpers/layout';
import Components from '../Components';
import { DragItem, Droppable } from '../Drag-n-Drop';
import { MENU_TYPE } from '../../constants';
import { getSearchParams, documentScrollTop } from '../../helpers/util';
import { getSortedUrlParams } from '../../helpers/urls';

import './style.scss';

class Layout extends Component {
  static propTypes = {
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        width: PropTypes.string,
        widgets: PropTypes.array
      })
    ).isRequired,
    menuType: PropTypes.string,
    className: PropTypes.string,
    onSaveWidget: PropTypes.func,
    onSaveWidgetProps: PropTypes.func,
    canDragging: PropTypes.bool
  };

  static defaultProps = {
    onSaveWidget: () => {},
    onSaveWidgetProps: () => {},
    canDragging: false,
    className: ''
  };

  state = {
    draggableDestination: ''
  };

  // for caching loaded components
  _components = {};

  get className() {
    const { className } = this.props;
    const classes = ['ecos-layout', className];

    return classes.join(' ');
  }

  get menuWidth() {
    const menu = document.querySelector('.slide-menu');

    if (!menu) {
      return 0;
    }

    return -menu.clientWidth;
  }

  draggablePositionAdjusment = () => {
    const { menuType } = this.props;

    return {
      top: menuType === MENU_TYPE.LEFT ? documentScrollTop() : 0,
      left: menuType === MENU_TYPE.LEFT ? this.menuWidth : 0
    };
  };

  handleDragUpdate = provided => {
    const { destination, source } = provided;

    if (!destination || !source) {
      this.setState({ draggableDestination: '' });
      return;
    }

    this.setState({
      draggableDestination: source.droppableId !== destination.droppableId ? destination.droppableId : ''
    });
  };

  handleDragEnd = result => {
    const { source, destination } = result;

    if (!destination || !source) {
      return;
    }

    const dataDrag = JSON.parse(result.draggableId);

    const dataDrop = JSON.parse(result.destination.droppableId);
    dataDrag.columnTo = dataDrop.index;

    dataDrag.positionTo = destination.index;
    // need another way
    source.index = dataDrag.positionFrom;

    this.setState({ draggableDestination: '' });
    this.props.onSaveWidget(dataDrag, { source, destination });
  };

  renderWidgets(widgets = [], columnName) {
    const { canDragging } = this.props;
    const { recordRef } = getSearchParams();
    const components = [];

    widgets.forEach((widget, index) => {
      const column = JSON.parse(columnName);
      const dataWidget = {
        columnFrom: column.index,
        name: widget.name,
        id: widget.id,
        positionFrom: index,
        positionTo: index,
        isWidget: true
      };
      const urlParams = getSortedUrlParams();
      const id = JSON.stringify(dataWidget);
      const key = `${widget.name}-${widget.id}-${urlParams}`;
      let Widget = this._components[widget.name];

      if (!Widget) {
        Widget = Components.get(widget.name);
        this._components[widget.name] = Widget;
      }

      if (canDragging) {
        components.push(
          <DragItem key={key} draggableId={id} isWrapper getPositionAdjusment={this.draggablePositionAdjusment}>
            <Widget
              {...widget.props}
              canDragging={canDragging}
              id={`${widget.props.id}-${urlParams}`}
              record={recordRef}
              onSave={this.props.onSaveWidgetProps}
            />
          </DragItem>
        );
      } else {
        components.push(
          <div key={key} className="ecos-layout__element">
            <Widget {...widget.props} canDragging={canDragging} record={recordRef} onSave={this.props.onSaveWidgetProps} />
          </div>
        );
      }
    });

    return components;
  }

  renderColumn = (column, index) => {
    if (Array.isArray(column)) {
      return column.map(this.renderColumn);
    }

    const { columns, type, canDragging } = this.props;
    const { draggableDestination } = this.state;
    const styles = {
      minWidth: getMinWidthColumn(type, index),
      width: column.width,
      height: '100%',
      borderRadius: '5px'
    };
    const otherWidth = columns.map(column => column.width || '').filter(item => item !== '');
    const withoutSize = columns.filter(column => !column.width).length;
    const availableWidth = otherWidth
      ? `(100% - ${otherWidth.length > 1 ? `(${otherWidth.join(' + ')})` : otherWidth.join(' + ')})`
      : '100%';

    if (!column.width) {
      styles.width = `calc(${availableWidth} / ${withoutSize})`;
    }

    const id = JSON.stringify({
      type: 'column',
      index
    });

    if (canDragging) {
      return (
        <Droppable
          droppableId={id}
          droppableIndex={index}
          className="ecos-layout__droppable ecos-layout__column"
          style={styles}
          key={id}
          isWrapper
          withoutScroll
          isDragingOver={Boolean(draggableDestination && draggableDestination === id)}
        >
          {this.renderWidgets(column.widgets, id)}
        </Droppable>
      );
    }

    return (
      <div className="ecos-layout__column" style={styles} key={id}>
        {this.renderWidgets(column.widgets, id)}
      </div>
    );
  };

  renderColumns() {
    const { columns } = this.props;

    if (!columns) {
      return null;
    }

    console.warn('columns => ', columns);

    return <div className="ecos-layout__column-wrapper">{columns && columns.map(this.renderColumn)}</div>;
  }

  render() {
    const { canDragging } = this.props;

    if (canDragging) {
      return (
        <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDragEnd}>
          <div className={this.className}>{this.renderColumns()}</div>
        </DragDropContext>
      );
    }

    return <div className={this.className}>{this.renderColumns()}</div>;
  }
}

export default Layout;
