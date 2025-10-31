import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import React from 'react';

import { DragItem } from '../../../components/Drag-n-Drop';
import Components from '../../../components/widgets/Components';

import WidgetActions from './WidgetActions';

export default class SelectedWidget extends React.Component {
  state = { isForceUpdate: false, isHidden: false };

  get label() {
    const { isMobile, widget } = this.props;
    return Components.getWidgetLabel(widget, isMobile);
  }

  get widgetData() {
    const { widget } = this.props;

    return {
      ...widget,
      props: {
        ...get(Components.components, [widget.name, 'props'], {}),
        ...(widget.props || {})
      }
    };
  }

  componentDidMount() {
    const { widget } = this.props;

    const checkIsAvailable = get(Components.components, [widget.name, 'checkIsAvailable']);

    if (isFunction(checkIsAvailable)) {
      this.setState({ isHidden: !checkIsAvailable() });
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      !isEqual(get(prevProps.widget, 'props.config.widgetDisplayCondition'), get(this.props.widget, 'props.config.widgetDisplayCondition'))
    ) {
      this.setState({ isForceUpdate: true }, () => this.setState({ isForceUpdate: false }));
    }
  }

  render() {
    const { widget, positionAdjustment, indexWidget, modelAttributes, executors } = this.props;
    const { isForceUpdate, isHidden } = this.state;

    if (isHidden) {
      return null;
    }

    return (
      !isForceUpdate && (
        <DragItem
          selected
          item={widget}
          draggableId={widget.dndId}
          draggableIndex={indexWidget}
          className="ecos-dashboard-settings__widgets-item"
          classNameActions="ecos-dashboard-settings__widgets-actions"
          title={this.label}
          getPositionAdjustment={positionAdjustment}
          actionsComponent={<WidgetActions widget={this.widgetData} executors={executors} modelAttributes={modelAttributes} />}
        />
      )
    );
  }
}
