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

class SetWidgets extends React.Component {
  static propTypes = {
    className: PropTypes.string,
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
    draggableDestination: ''
  };

  getWidgetLabel(widget) {
    return t(get(Components.components, [widget.name, 'label'], get(widget, 'label', '')));
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
    const { availableWidgets, activeWidgets, setData } = this.props;

    let selectedWidgets = deepClone(activeWidgets);

    if (!isEmpty(source) && !isEmpty(destination) && destination.droppableId !== NAMES.WIDGETS_FROM) {
      const colIndex = destination.droppableId.split(NAMES.WIDGETS_TO)[1];
      const colSelected = activeWidgets[colIndex];

      switch (source.droppableId) {
        case NAMES.WIDGETS_FROM:
          set(selectedWidgets, [colIndex], DndUtils.copy(availableWidgets, activeWidgets[colIndex], source, destination, true));
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
    setData(selectedWidgets);
  };

  handleRemoveWidget = ({ item }, indexColumn, indexWidget) => {
    const { activeWidgets, setData } = this.props;
    const newActiveWidgets = deepClone(activeWidgets);

    newActiveWidgets[indexColumn].splice(indexWidget, 1);
    setData(newActiveWidgets);
  };

  renderWidgetColumns() {
    const { activeWidgets, columns, isMobile } = this.props;
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
                <div className="ecos-dashboard-settings__column-widgets__title">
                  {`${t('dashboard-settings.column')} ${indexColumn + 1}`}
                </div>
              )}
              <Droppable
                droppableId={NAMES.WIDGETS_TO + indexColumn}
                droppableIndex={indexColumn}
                childPosition="column"
                className="ecos-dashboard-settings__drag-container ecos-dashboard-settings__column-widgets__items"
                placeholder={t('dashboard-settings.column.placeholder')}
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
                      canRemove={true}
                      removeItem={response => {
                        this.handleRemoveWidget(response, indexColumn, indexWidget);
                      }}
                      item={widget}
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
    const { availableWidgets, isMobile } = this.props;

    return (
      <>
        <h5 className="ecos-dashboard-settings__container-title">{t('dashboard-settings.widgets.title')}</h5>
        <h6 className="ecos-dashboard-settings__container-subtitle">
          {isMobile ? t('dashboard-settings.widgets.subtitle-mobile') : t('dashboard-settings.widgets.subtitle')}
        </h6>
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
              placeholder={t('dashboard-settings.widgets.placeholder')}
              isDropDisabled={true}
              scrollHeight={136}
            >
              {availableWidgets &&
                availableWidgets.length &&
                availableWidgets.map((item, index) => (
                  <DragItem isCloning key={item.dndId} draggableId={item.dndId} draggableIndex={index} title={this.getWidgetLabel(item)} />
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
