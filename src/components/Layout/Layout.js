import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import { t } from '../../helpers/util';
import { getMinWidthColumn } from '../../helpers/layout';
import Components from '../Components';
import { DragItem, Droppable } from '../Drag-n-Drop';
import './style.scss';

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

    const dataDrag = JSON.parse(result.draggableId);

    const dataDrop = JSON.parse(result.destination.droppableId);
    dataDrag.columnTo = dataDrop.index;

    dataDrag.positionTo = destination.index;
    // need another way
    source.index = dataDrag.positionFrom;

    this.setState({ draggableDestination: '' });
    this.props.onSaveWidget(dataDrag, { source, destination });
  };

  renderLoadingWidget() {
    return <div>{t('Loading...')}</div>;
  }

  renderWidgets(widgets = [], columnName) {
    const components = [];

    widgets.forEach((widget, index) => {
      const Widget = Components.get(widget.name);
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
    const { columns, type } = this.props;
    const { draggableDestination } = this.state;
    const styles = {
      minWidth: getMinWidthColumn(type, index),
      width: column.width,
      height: '100%',
      borderRadius: '5px'
    };
    const otherWidth = columns
      .map(column => column.width || '')
      .filter(item => item !== '')
      .join(' + ');
    const withoutSize = columns.filter(column => !column.width).length;
    const availableWidth = otherWidth ? `(100% - ${otherWidth})` : '100%';

    if (!column.width) {
      styles.width = `calc(${availableWidth} / ${withoutSize})`;
    }

    const id = JSON.stringify({
      type: 'column',
      index
    });

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
