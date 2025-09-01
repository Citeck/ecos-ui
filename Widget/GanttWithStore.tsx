import React, { Component, createRef } from 'react';
import { Gantt } from 'wx-react-gantt';

export default class GanttWithRef extends Component {
  constructor(props: any) {
    super(props);

    this.state = {
      tasks: [
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
      ],
      links: [{ id: 1, source: 20, target: 21, type: 'e2e' }],
      scales: [
        { unit: 'month', step: 1, format: 'MMMM yyy' },

        { unit: 'day', step: 1, format: 'd' }
      ]
    };
  }

  get taskTypes() {
    return [
      { id: 'task', label: 'Task' },
      { id: 'summary', label: 'Summary task' },
      { id: 'milestone', label: 'Milestone' }
    ];
  }

  init(api: {
    getState: () => { (): any; new (): any; tasks: any[] };
    on: (arg0: string, arg1: { (task: any): void; (task: any): void; (task: any): void }) => void;
  }) {
    api.getState().tasks.forEach((task: any) => {
      console.log('gantt', task);
    });
    api.on('add-task', (task: any) => {
      console.log('gantt', task);
    });
    api.on('update-task', (task: any) => {
      console.log('gantt', task);
    });
    api.on('delete-task', (task: any) => {
      console.log('gantt', task);
    });
  }

  render() {
    return (
      <Gantt init={this.init} tasks={this.state.tasks} taskTypes={this.taskTypes} links={this.state.links} scales={this.state.scales} />
    );
  }
}
