import React, { Component, Suspense } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { DragDropContext } from 'react-beautiful-dnd';
import ReactResizeDetector from 'react-resize-detector';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { MENU_TYPE } from '../../constants';
import { LAYOUT_TYPE } from '../../constants/layout';
import { documentScrollTop, getSearchParams } from '../../helpers/util';
import { getMinWidthColumn } from '../../helpers/layout';
import Components from '../widgets/Components';
import { DragItem, Droppable } from '../Drag-n-Drop';
import { Loader } from '../../components/common';

import './style.scss';

class Layout extends Component {
  static propTypes = {
    columns: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.arrayOf(
          PropTypes.shape({
            width: PropTypes.string,
            widgets: PropTypes.array
          })
        ),
        PropTypes.shape({
          width: PropTypes.string,
          widgets: PropTypes.array
        })
      ])
    ),
    menuType: PropTypes.string,
    className: PropTypes.string,
    type: PropTypes.string,
    onSaveWidget: PropTypes.func,
    onSaveWidgetProps: PropTypes.func,
    canDragging: PropTypes.bool
  };

  static defaultProps = {
    canDragging: false,
    className: '',
    type: '',
    onSaveWidget: () => {},
    onSaveWidgetProps: () => {}
  };

  // for caching loaded widgets
  #loadedWidgets = {};

  state = {
    draggableDestination: ''
  };

  _wrapperRef = React.createRef();

  componentDidMount() {
    this.checkWrapperStyle();
  }

  componentDidUpdate() {
    this.checkWrapperStyle();
  }

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

  checkWrapperStyle() {
    const { columns } = this.props;
    const wrapper = get(this._wrapperRef, 'current', null);

    if (wrapper) {
      wrapper.style.flexDirection = '';

      if (Array.isArray(get(columns, '0', null))) {
        wrapper.style.flexDirection = 'column';
      }

      this.checkWidgets();
    }
  }

  checkWidgets = () => {
    const { type } = this.props;

    if (type !== LAYOUT_TYPE.ADAPTIVE) {
      return;
    }

    const wrapper = get(this._wrapperRef, 'current', null);

    if (wrapper) {
      const adaptiveColumns = [...wrapper.querySelectorAll('.ecos-layout__column_adaptive')];

      if (!adaptiveColumns.length) {
        return;
      }

      adaptiveColumns.forEach(adaptiveColumn => {
        const columnWidth = adaptiveColumn.offsetWidth;
        const items = [...adaptiveColumn.querySelectorAll('.ecos-layout__element')];
        const countInnerColumns = Math.floor(columnWidth / get(items, '[0].offsetWidth', 1));

        items.forEach((item, index) => {
          item.style.marginTop = 0;

          if (countInnerColumns && index < countInnerColumns) {
            return;
          }

          let topElement;

          if (countInnerColumns) {
            topElement = items[index - countInnerColumns];
          } else {
            topElement = items[index - 1];
          }

          const topElementChild = get(topElement, 'firstElementChild', null);

          if (!topElement || !topElementChild) {
            return;
          }

          item.style.marginTop = `${topElementChild.offsetHeight - topElement.offsetHeight}px`;
        });
      });
    }
  };

  draggablePositionAdjustment = () => {
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
    const { canDragging, tabId, isActiveLayout } = this.props;
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
      const id = JSON.stringify(dataWidget);
      const key = `${widget.name}-${widget.id}`;
      const commonProps = {
        canDragging,
        tabId,
        isActiveLayout,
        record: recordRef,
        onSave: this.props.onSaveWidgetProps,
        onLoad: this.checkWidgets,
        onUpdate: this.checkWidgets
      };
      let Widget = this.#loadedWidgets[widget.name];

      if (!Widget) {
        Widget = Components.get(widget.name);
        this.#loadedWidgets[widget.name] = Widget;
      }

      if (canDragging) {
        components.push(
          <DragItem key={key} draggableId={id} isWrapper getPositionAdjusment={this.draggablePositionAdjustment}>
            <Suspense fallback={<Loader type="points" />}>
              <Widget {...widget.props} {...commonProps} id={widget.props.id} />
            </Suspense>
          </DragItem>
        );
      } else {
        components.push(
          <div key={key} className="ecos-layout__element">
            <Suspense fallback={<Loader type="points" />}>
              <Widget {...widget.props} {...commonProps} />
            </Suspense>
          </div>
        );
      }
    });

    return components;
  }

  renderColumn = (columns, column, index) => {
    if (Array.isArray(column)) {
      this.checkWrapperStyle();

      return (
        <div className="ecos-layout__row" key={index}>
          {column.map((...data) => this.renderColumn(column, ...data))}
        </div>
      );
    }

    const { type, canDragging } = this.props;
    const { draggableDestination } = this.state;
    const styles = {
      minWidth: getMinWidthColumn(type, index),
      width: column.width,
      height: '100%',
      borderRadius: '5px'
    };
    const otherWidth = columns.map(column => column.width || '').filter(item => item !== '');
    const withoutSize = columns.filter(column => !column.width).length;
    const availableWidth = otherWidth.length ? `(100% - (${otherWidth.join(' + ')}))` : '100%';
    const id = JSON.stringify({ type: 'column', index });

    if (!column.width) {
      styles.width = `calc(${availableWidth} / ${withoutSize})`;
    }

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
      <div className={classNames('ecos-layout__column', `ecos-layout__column_${type}`)} style={styles} key={id}>
        {this.renderWidgets(column.widgets, id)}
      </div>
    );
  };

  renderLayout() {
    const { columns } = this.props;

    if (isEmpty(columns)) {
      return null;
    }

    return (
      <div className="ecos-layout__wrapper" ref={this._wrapperRef}>
        {columns.map((...data) => this.renderColumn(columns, ...data))}
        <ReactResizeDetector handleWidth onResize={this.checkWidgets} />
      </div>
    );
  }

  render() {
    const { canDragging } = this.props;

    if (canDragging) {
      return (
        <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDragEnd}>
          <div className={this.className}>{this.renderLayout()}</div>
        </DragDropContext>
      );
    }

    return <div className={this.className}>{this.renderLayout()}</div>;
  }
}

export default Layout;
