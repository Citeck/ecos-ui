import * as React from 'react';
// @ts-ignore
import { Willow } from 'wx-react-gantt';

import GanttWithStore from './GanttWithStore';

import Dashlet from '@/components/Dashlet';
import BaseWidget, { BaseWidgetProps, BaseWidgetState } from '@/components/widgets/BaseWidget';
import { getRecordRef, getWorkspaceId } from '@/helpers/urls';

import 'wx-react-gantt/dist/gantt.css';
import './style.scss';

interface GanttChartWidgetProps extends BaseWidgetProps {
  config?: {
    ganttSettingsRef?: string;
    collapsed?: boolean;
  };
}

class GanttChartWidget<P extends GanttChartWidgetProps, S extends BaseWidgetState> extends BaseWidget<P, S> {
  static TYPE = 'gantt_chart';

  render() {
    const { config, record } = this.props;
    const ganttSettingsRef = config?.ganttSettingsRef || record;

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
              <GanttWithStore ganttSettingsRef={ganttSettingsRef} currentRef={getRecordRef() || record} workspace={getWorkspaceId()} />
            </div>
          </Willow>
        </Dashlet>
      </div>
    );
  }
}

export default GanttChartWidget;
