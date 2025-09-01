import React from 'react';
// @ts-ignore
import { Gantt, Willow, Toolbar, defaultToolbarButtons, ButtonProps } from 'wx-react-gantt';

import Dashlet from '@/components/Dashlet';
import BaseWidget, { BaseWidgetProps, BaseWidgetState } from '@/components/widgets/BaseWidget';

import 'wx-react-gantt/dist/gantt.css';
import './style.scss';

class GanttChartWidget<P extends BaseWidgetProps, S extends BaseWidgetState> extends BaseWidget<P, S> {
  private apiRef = React.createRef();

  get tasks() {
    return [
      {
        id: 20,
        text: 'New Task',
        start: new Date(2024, 5, 11),
        end: new Date(2024, 6, 12),
        duration: 1,
        progress: 2,
        type: 'task',
        lazy: false
      },
      {
        id: 47,
        text: '[1] Master project',
        start: new Date(2024, 5, 12),
        end: new Date(2024, 7, 12),
        duration: 8,
        progress: 0,
        parent: 0,
        type: 'summary'
      },
      {
        id: 22,
        text: 'Task',
        start: new Date(2024, 7, 11),
        end: new Date(2024, 8, 12),
        duration: 8,
        progress: 0,
        parent: 47,
        type: 'task'
      },
      {
        id: 21,
        text: 'New Task 2',
        start: new Date(2024, 7, 10),
        end: new Date(2024, 8, 12),
        duration: 3,
        progress: 0,
        type: 'task',
        lazy: false
      }
    ];
  }

  get links() {
    return [{ id: 1, source: 20, target: 21, type: 'e2e' }];
  }

  get scales() {
    return [
      { unit: 'month', step: 1, format: 'MMMM yyy' },
      { unit: 'day', step: 1, format: 'd' }
    ];
  }

  get taskTypes() {
    return [
      { id: 'task', label: 'Task' },
      { id: 'summary', label: 'Summary task' },
      { id: 'milestone', label: 'Milestone' }
    ];
  }

  componentDidMount(): void {
    super.componentDidMount();

    if (this.apiRef.current) {
      this.apiRef.current.on('render-data', ev => {
        console.log('The ID of the last visible row', ev);
      });
      this.apiRef.current.on('request-data', data => {
        console.log('Data request for: ', data);
      });
    }
  }

  render() {
    const items = defaultToolbarButtons.filter((b: ButtonProps) => {
      return b.id?.indexOf('indent') === -1;
    });

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
            <Toolbar api={this.apiRef.current} items={items} />
            <div className="gtcell">
              <Gantt
                apiRef={this.apiRef}
                tasks={this.tasks}
                links={this.links}
                scales={this.scales}
                taskTypes={this.taskTypes}
                readonly={false}
              />
            </div>
          </Willow>
        </Dashlet>
      </div>
    );
  }
}

export default GanttChartWidget;
