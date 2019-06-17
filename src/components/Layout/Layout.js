import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import { t } from '../../helpers/util';
import Components from '../Components';
import { DragItem, Droppable } from '../Drag-n-Drop';
import './style.scss';

const _DATA = '@data@';
const _DIV = '@';
const WIDGET_INDEX = `${_DATA}index${_DIV}`;
const WIDGET_NAME = `${_DATA}name${_DIV}`;
const WIDGET_ID = `${_DATA}id${_DIV}`;
const COLUMN_INDEX = `${_DATA}columnFrom${_DIV}`;

class Layout extends Component {
  static propTypes = {
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        width: PropTypes.string,
        widgets: PropTypes.array
      })
    ).isRequired,
    onSaveWidget: PropTypes.func
  };

  static defaultProps = {
    onSaveWidget: () => {}
  };

  state = {
    draggableDestination: ''
  };

  get className() {
    const classes = ['ecos-layout'];

    return classes.join(' ');
  }

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

    const dndInfoStr = result.draggableId;
    const data = getDndInfo(dndInfoStr);

    data.columnTo = result.destination.droppableId.split(COLUMN_INDEX).slice(-1);
    data.positionFrom = source.index;
    data.positionTo = destination.index;
    data.isWidget = dndInfoStr.indexOf(WIDGET_NAME) >= 0;

    this.setState({ draggableDestination: '' });
    this.props.onSaveWidget(data, { source, destination });
  };

  renderLoadingWidget() {
    return <div>{t('Loading...')}</div>;
  }

  renderWidgets(widgets = [], columnName) {
    const components = [];

    widgets.forEach((widget, index) => {
      const Widget = Components.get(widget.name);
      const id = `${columnName}${WIDGET_NAME}${widget.name}${WIDGET_ID}${widget.id}${WIDGET_INDEX}${index}`;

      components.push(
        <React.Suspense fallback={this.renderLoadingWidget()} key={id}>
          <DragItem draggableId={id} isWrapper>
            <Widget {...widget.props} />
          </DragItem>
        </React.Suspense>
      );
    });

    return components;
  }

  renderColumn = (column, index) => {
    const { columns } = this.props;
    const { draggableDestination } = this.state;
    const styles = {
      minWidth: column.width,
      width: column.width,
      height: '100%',
      borderRadius: '5px'
    };
    const otherWidth = columns
      .map(column => column.width || '')
      .filter(item => item !== '')
      .join(' + ');
    const withoutSize = columns.filter(column => !column.width).length;

    if (!column.width) {
      styles.width = `calc((100% - ${otherWidth}) / ${withoutSize})`;
    }

    const id = `column${COLUMN_INDEX}${index}`;

    return (
      <Droppable
        droppableId={id}
        droppableIndex={index}
        className="ecos-layout__droppable ecos-layout__column"
        style={styles}
        key={id}
        isWrapper
        withoutScroll
        isDragingOver={draggableDestination && draggableDestination === id}
      >
        {this.renderWidgets(column.widgets, id)}
      </Droppable>
    );
  };

  renderColumns() {
    const { columns } = this.props;

    if (!columns) {
      return null;
    }

    return <div className="ecos-layout__column-wrapper">{columns && columns.map(this.renderColumn)}</div>;
  }

  render() {
    return (
      <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDragEnd}>
        <div className={this.className}>{this.renderColumns()}</div>
      </DragDropContext>
    );
  }
}

export default Layout;

function getDndInfo(infoStr) {
  const attrs = infoStr.split(_DATA);
  const data = {};

  attrs.forEach(item => {
    if (item) {
      const param = item.split(_DIV);
      if (param.length === 2) {
        data[param[0]] = param[1];
      }
    }
  });

  return data;
}
