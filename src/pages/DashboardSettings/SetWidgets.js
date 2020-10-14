import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-beautiful-dnd';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import set from 'lodash/set';
import classNames from 'classnames';

import { deepClone, t } from '../../helpers/util';
import { DndUtils, DragItem, Droppable } from '../../components/Drag-n-Drop';
import Components from '../../components/widgets/Components';

import './style.scss';

const NAMES = {
  WIDGETS_FROM: 'availableWidgets',
  WIDGETS_TO: 'selectedWidgets'
};

const Labels = {
  TITLE: 'dashboard-settings.widgets.title',
  SUBTITLE: 'dashboard-settings.widgets.subtitle',
  SUBTITLE_M: 'dashboard-settings.widgets.subtitle-mobile',
  TIP_NO_AVAILABLE: 'dashboard-settings.widgets.placeholder',
  COLUMN: 'dashboard-settings.column',
  TIP_DROP_HERE: 'dashboard-settings.column.placeholder',
  WIDGET_WITH_CONFIG: 'dashboard-settings.widget.with-config'
};

class SetWidgets extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    menuType: PropTypes.string,
    availableWidgets: PropTypes.array,
    activeWidgets: PropTypes.array,
    setData: PropTypes.func,
    positionAdjustment: PropTypes.func,
    isMobile: PropTypes.bool
  };

  static defaultProps = {
    className: '',
    availableWidgets: [],
    activeWidgets: [],
    columns: [],
    setData: () => {},
    positionAdjustment: () => {},
    isMobile: false
  };

  state = {
    draggableDestination: '',
    removedWidgets: []
  };

  getWidgetLabel(widget) {
    const { isMobile } = this.props;
    const description = get(widget, 'description', '');
    let label = t(get(Components.components, [widget.name, 'label'], get(widget, 'label', '')));

    if (isMobile && description) {
      label = `[${description}] ${label}`;
    }

    return label;
  }

  get availableWidgets() {
    const { availableWidgets, isMobile, activeWidgets } = this.props;

    if (isEmpty(availableWidgets)) {
      return [];
    }

    if (!isMobile) {
      return availableWidgets;
    }

    const ids = get(activeWidgets, '[0]', []).map(item => item.id);

    return availableWidgets.filter(widget => !ids.includes(widget.id));
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

  handleDropEndWidget = result => {
    const { source, destination } = result;
    const { activeWidgets } = this.props;

    let selectedWidgets = deepClone(activeWidgets);

    if (!isEmpty(source) && !isEmpty(destination) && destination.droppableId !== NAMES.WIDGETS_FROM) {
      const colIndex = destination.droppableId.split(NAMES.WIDGETS_TO)[1];
      const colSelected = activeWidgets[colIndex];

      switch (source.droppableId) {
        case NAMES.WIDGETS_FROM:
          set(selectedWidgets, [colIndex], DndUtils.copy(this.availableWidgets, activeWidgets[colIndex], source, destination, true));
          break;
        case destination.droppableId:
          set(selectedWidgets, [colIndex], DndUtils.reorder(colSelected, source.index, destination.index));
          break;
        default:
          const colSourceIndex = source.droppableId.split(NAMES.WIDGETS_TO)[1];
          const colSource = activeWidgets[colSourceIndex];
          const resultMove = DndUtils.move(colSource, colSelected, source, destination);

          set(selectedWidgets, [colSourceIndex], resultMove[source.droppableId]);
          set(selectedWidgets, [colIndex], resultMove[destination.droppableId]);
          break;
      }
    }

    this.setState({ draggableDestination: '' });
    this.setData(selectedWidgets);
  };

  handleRemoveWidget = ({ item }, indexColumn, indexWidget) => {
    const { activeWidgets } = this.props;
    const { removedWidgets } = this.state;
    const newActiveWidgets = deepClone(activeWidgets);

    if (item.id) {
      removedWidgets.push(item.id);
      this.setState({ removedWidgets });
    }

    newActiveWidgets[indexColumn].splice(indexWidget, 1);
    this.setData(newActiveWidgets, removedWidgets);
  };

  setData = (activeWidgets, removedWidgets) => {
    this.props.setData(activeWidgets, removedWidgets);
  };

  getMessage = widget => {
    const hasSettings = !isEmpty(get(widget, 'props.config', {}));

    if (!hasSettings) {
      return '';
    }

    return t(Labels.WIDGET_WITH_CONFIG);
  };

  renderWidgetColumns() {
    const { activeWidgets, columns, isMobile, positionAdjustment } = this.props;
    const { draggableDestination } = this.state;

    return (
      <div
        className={classNames('ecos-dashboard-settings__drag-container', {
          'ecos-dashboard-settings__drag-container_widgets-to': !isMobile,
          'ecos-dashboard-settings__drag-container_widgets-to_mobile': isMobile
        })}
      >
        {[].concat(...columns).map((column, indexColumn) => {
          const key_id = `column-widgets-${indexColumn}`;

          return (
            <div className="ecos-dashboard-settings__column-widgets" key={key_id}>
              {isMobile ? null : (
                <div className="ecos-dashboard-settings__column-widgets__title">{`${t(Labels.COLUMN)} ${indexColumn + 1}`}</div>
              )}
              <Droppable
                droppableId={NAMES.WIDGETS_TO + indexColumn}
                droppableIndex={indexColumn}
                childPosition="column"
                className="ecos-dashboard-settings__drag-container ecos-dashboard-settings__column-widgets__items"
                classNameView="ecos-dashboard-settings__drag-scrollbar-wrapper"
                placeholder={t(Labels.TIP_DROP_HERE)}
                isDragingOver={draggableDestination === NAMES.WIDGETS_TO + indexColumn}
                scrollHeight={320}
              >
                {activeWidgets &&
                  activeWidgets[indexColumn] &&
                  activeWidgets[indexColumn].map((widget, indexWidget) => (
                    <DragItem
                      key={widget.dndId}
                      draggableId={widget.dndId}
                      draggableIndex={indexWidget}
                      className="ecos-dashboard-settings__column-widgets__items__cell"
                      title={this.getWidgetLabel(widget)}
                      selected={true}
                      tooltipClassName="ecos-dashboard-settings__tooltip"
                      alertTooltip={this.getMessage(widget)}
                      canRemove={true}
                      removeItem={response => {
                        this.handleRemoveWidget(response, indexColumn, indexWidget);
                      }}
                      item={widget}
                      getPositionAdjustment={positionAdjustment}
                    />
                  ))}
              </Droppable>
            </div>
          );
        })}
      </div>
    );
  }

  render() {
    const { isMobile, positionAdjustment } = this.props;

    return (
      <>
        <h5 className="ecos-dashboard-settings__container-title">{t(Labels.TITLE)}</h5>
        <h6 className="ecos-dashboard-settings__container-subtitle">{isMobile ? t(Labels.SUBTITLE_M) : t(Labels.SUBTITLE)}</h6>
        <div
          className={classNames('ecos-dashboard-settings__container-group', {
            'ecos-dashboard-settings__container-group_mobile': isMobile
          })}
        >
          <DragDropContext onDragUpdate={this.handleDragUpdate} onDragEnd={this.handleDropEndWidget}>
            <Droppable
              droppableId={NAMES.WIDGETS_FROM}
              className={classNames('ecos-dashboard-settings__drag-container ecos-dashboard-settings__drag-container_col', {
                'ecos-dashboard-settings__drag-container_widgets-from_mobile': isMobile
              })}
              classNameView="ecos-dashboard-settings__drag-scrollbar-wrapper"
              placeholder={t(Labels.TIP_NO_AVAILABLE)}
              isDropDisabled
              scrollHeight={250}
              autoHeight
            >
              {this.availableWidgets.map((item, index) => (
                <DragItem
                  className={classNames({
                    'ecos-drag-item_by-content': isMobile
                  })}
                  isCloning={!isMobile}
                  key={item.dndId}
                  draggableId={item.dndId}
                  draggableIndex={index}
                  title={this.getWidgetLabel(item)}
                  getPositionAdjustment={positionAdjustment}
                />
              ))}
            </Droppable>
            {this.renderWidgetColumns()}
          </DragDropContext>
        </div>
      </>
    );
  }
}

export default SetWidgets;
