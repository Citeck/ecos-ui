import React from 'react';
// @ts-ignore
import { Willow, defaultToolbarButtons, ButtonProps } from 'wx-react-gantt';

import GanttWithStore from './GanttWithStore';

import Dashlet from '@/components/Dashlet';
import BaseWidget, { BaseWidgetProps, BaseWidgetState } from '@/components/widgets/BaseWidget';

import 'wx-react-gantt/dist/gantt.css';
import './style.scss';

class GanttChartWidget<P extends BaseWidgetProps, S extends BaseWidgetState> extends BaseWidget<P, S> {
  static TYPE = 'gantt_chart';

  render() {
    return (
      <div className="ecos-gantt-chart-widget">
        {/* @ts-ignore */}
        <Dashlet
          {...this.props}
          needsUpdate={false}
          title="Gantt Chart"
          needGoTo={false}
          onToggleCollapse={this.handleToggleContent}
          isCollapsed={this.isCollapsed}
        >
          <Willow>
            <div className="gtcell">
              <GanttWithStore />
            </div>
          </Willow>
        </Dashlet>
      </div>
    );
  }
}

export default GanttChartWidget;
