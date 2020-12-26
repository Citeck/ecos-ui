import React from 'react';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';

import Components from '../../../components/widgets/Components';
import { DragItem } from '../../../components/Drag-n-Drop';
import WidgetActions from './WidgetActions';

export default class SelectedWidget extends React.Component {
  state = { isForceUpdate: false };

  get label() {
    const { isMobile, widget } = this.props;
    return Components.getWidgetLabel(widget, isMobile);
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
    const { isForceUpdate } = this.state;

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
          actionsComponent={<WidgetActions widget={widget} executors={executors} modelAttributes={modelAttributes} />}
        />
      )
    );
  }
}
