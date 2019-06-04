import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { MENU_TYPE } from '../../constants/dashboardSettings';
import Components from '../Components';
import './style.scss';
import { DragDropContext } from 'react-beautiful-dnd';
import { DragItem, Droppable } from '../Drag-n-Drop';

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
    const config = {};

    if (!result.destination || !result.source) {
      return;
    }

    const columnFrom = result.source.droppableId.split('-').slice(-1);
    const columnTo = result.destination.droppableId.split('-').slice(-1);

    console.warn(result, columnFrom, columnTo);
    this.setState({ draggableDestination: '' });

    // this.props.saveDashboardConfig(config);
  };

  renderMenuItem = link => {
    return (
      <Link className="ecos-layout__menu-item" to={link.link} title={link.title} key={link.position}>
        <div className="ecos-layout__menu-item-title">{link.title}</div>
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

      components.push(
        <React.Suspense fallback={<div>Loading...</div>} key={`${widget.name}-${index}`}>
          <DragItem draggableId={`${columnName}-${widget.name}-${index}`} isWrapper>
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

    return (
      <Droppable
        droppableId={`column-${index}`}
        className="ecos-layout__droppable ecos-layout__column"
        style={styles}
        key={index}
        isWrapper
        withoutScroll
        isDragingOver={draggableDestination && draggableDestination === `column-${index}`}
      >
        {this.renderWidgets(column.widgets, `column-${index}`)}
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
