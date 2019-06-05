import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { t } from '../../helpers/util';
import { MENU_TYPE } from '../../constants/dashboardSettings';
import Components from '../Components';
import './style.scss';
import { DragDropContext } from 'react-beautiful-dnd';
import { DragItem, Droppable } from '../Drag-n-Drop';

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
    menu: PropTypes.shape({
      type: PropTypes.oneOf(Object.keys(MENU_TYPE).map(key => MENU_TYPE[key])),
      links: PropTypes.arrayOf(PropTypes.object)
    }).isRequired
  };

  static defaultProps = {};

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
    if (!result.destination || !result.source) {
      return;
    }
    console.warn('result', result);
    const widgetInfoStr = result.draggableId;
    const data = getWidgetInfo(widgetInfoStr);

    data.columnTo = result.destination.droppableId.split(COLUMN_INDEX).slice(-1);

    this.setState({ draggableDestination: '' });
    this.props.saveDashboardConfig(data);
  };

  renderMenuItem = link => {
    return (
      <Link className="ecos-layout__menu-item" to={link.link} title={t(link.label)} key={link.position}>
        <div className="ecos-layout__menu-item-title">{t(link.label)}</div>
        <i className="ecos-btn__i ecos-layout__menu-item-i-next" />
        <i className="ecos-btn__i icon-drag ecos-layout__menu-item-i-drag" />
      </Link>
    );
  };

  renderMenu() {
    const {
      menu: { type, links }
    } = this.props;

    if (type === MENU_TYPE.LEFT) {
      return;
    }

    return <div className="ecos-layout__menu">{links && links.map(this.renderMenuItem)}</div>;
  }

  renderWidgets(widgets = [], columnName) {
    const components = [];

    widgets.forEach((widget, index) => {
      const Widget = Components.get(widget.name);
      const id = `${columnName}${WIDGET_NAME}${widget.name}${WIDGET_ID}${widget.id}${WIDGET_INDEX}${index}`;

      components.push(
        <React.Suspense fallback={<div>Loading...</div>} key={id}>
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
        <div className={this.className}>
          {this.renderMenu()}
          {this.renderColumns()}
        </div>
      </DragDropContext>
    );
  }
}

export default Layout;

function getWidgetInfo(infoStr) {
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
