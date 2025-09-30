import React from 'react';

import Gantt from '../libs/svelte-gantt';
import GanttDataLoader from '../services/GanttDataLoader';

// @ts-ignore
import Records from '@/components/Records/Records';

interface GanttTask {
  id: string;
  text: string;
  start: Date;
  end: Date;
  duration?: number;
  progress?: number;
  parent?: string;
  type?: string;
  lazy?: boolean;
  description?: string;
}

interface GanttLink {
  id: string;
  source: string;
  target: string;
  type?: string;
}

interface GanttScale {
  unit: string;
  step: number;
  format: string;
}

interface GanttState {
  tasks: GanttTask[];
  links: GanttLink[];
  scales: GanttScale[];
  isLoading: boolean;
  error?: string;
}

interface GanttProps {
  ganttSettingsRef?: string;
  ganttDataRef?: string;
  currentRef?: string;
  workspace?: string;
}

export default class GanttWithStore extends React.PureComponent<GanttProps, GanttState> {
  constructor(props: GanttProps) {
    super(props);

    this.state = {
      tasks: [],
      links: [],
      scales: [
        { unit: 'month', step: 1, format: 'MMMM yyyy' },
        { unit: 'day', step: 1, format: 'd' }
      ],
      isLoading: true,
      error: undefined
    };
  }

  componentDidMount() {
    this.loadGanttData();
  }

  async loadGanttData() {
    const { ganttSettingsRef } = this.props;

    if (!ganttSettingsRef) {
      try {
        // @ts-ignore
        const newSettingsRecord = Records.get('emodel/gantt-settings@');
        newSettingsRecord.att('dataType', 'STANDALONE');

        const result = await newSettingsRecord.save();

        await this.loadGanttDataWithSettings(result.id);
      } catch (error: any) {
        console.error('Failed to create default Gantt settings:', error);
        this.setState({
          isLoading: false,
          error: error.message || 'Failed to create default Gantt settings'
        });
      }
      return;
    }

    await this.loadGanttDataWithSettings(ganttSettingsRef);
  }

  async loadGanttDataWithSettings(ganttSettingsRef: string) {
    try {
      this.setState({ isLoading: true, error: undefined });

      const ganttSettings = await GanttDataLoader.loadGanttSettings(ganttSettingsRef);

      let tasks: GanttTask[] = [];
      let links: GanttLink[] = [];

      if (ganttSettings.dataType === 'STANDALONE') {
        if (ganttSettings.data) {
          const result = await GanttDataLoader.loadGanttData(ganttSettings.data);
          tasks = result.tasks;
          links = result.links;
        } else {
          // @ts-ignore
          const newDataRecord = Records.get('emodel/gantt-data@');
          const newDataResult = await newDataRecord.save();

          // @ts-ignore
          const settingsRecord = Records.getRecordToEdit(ganttSettingsRef);
          settingsRecord.att('data', newDataResult.id);
          await settingsRecord.save();

          tasks = [];
          links = [];
        }
      } else if (ganttSettings.dataType === 'LINKED') {
        const result = await GanttDataLoader.loadLinkedGanttData(
          ganttSettings.dataSourceId,
          ganttSettings.manualDataSourceId,
          ganttSettings.linkedWithType,
          ganttSettings.linkedWithRef,
          this.props.currentRef || '',
          this.props.workspace || ''
        );
        tasks = result.tasks;
        links = result.links;
      } else {
        this.setState({
          isLoading: false,
          error: 'Unknown gantt data type'
        });
        return;
      }

      this.setState({
        tasks,
        links,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Failed to load Gantt data:', error);
      this.setState({
        isLoading: false,
        error: error.message || 'Failed to load Gantt data'
      });
    }
  }

  get taskTypes() {
    return [
      { id: 'task', label: 'Task' },
      { id: 'summary', label: 'Summary task' },
      { id: 'milestone', label: 'Milestone' }
    ];
  }

  init = (api: any) => {
    // api.getState().tasks.forEach((task: any) => {
    //   console.log('Gantt task loaded', task);
    // });

    api.on('add-task', async (task: any) => {
      console.log('Gantt add-task', task);
      try {
        const { ganttSettingsRef } = this.props;

        if (!ganttSettingsRef) {
          console.error('No gantt settings reference provided, task not saved');
          return;
        }

        const ganttSettings = await GanttDataLoader.loadGanttSettings(ganttSettingsRef);

        if (!ganttSettings.data) {
          throw new Error('No gantt data reference found in settings');
        }

        await GanttDataLoader.createActivity(ganttSettings.data, task);
      } catch (error: any) {
        this.setState({
          error: error.message || 'Failed to create task'
        });
      }
    });

    api.on('update-task', async (task: any) => {
      console.log('Gantt update-task', task);
      const { ganttSettingsRef } = this.props;

      if (!ganttSettingsRef) {
        return;
      }

      try {
        await GanttDataLoader.updateActivity(task.id, task);
      } catch (error: any) {
        console.error('Failed to update task:', error);
        this.setState({
          error: error.message || 'Failed to update task'
        });
      }
    });

    api.on('delete-task', async (task: any) => {
      console.log('Gantt delete-task', task);
      try {
        await GanttDataLoader.deleteActivity(task.id);
      } catch (error: any) {
        console.error('Failed to delete task:', error);
        this.setState({
          error: error.message || 'Failed to delete task'
        });
      }
    });

    api.on('move-task', async (task: any) => {
      console.log('Gantt move-task', task);
      // try {
      //   const { ganttSettingsRef } = this.props;
      //   if (!ganttSettingsRef) {
      //     console.log('No gantt settings reference provided, task not dragged');
      //     return;
      //   }

      //   await GanttDataLoader.updateActivity(task.id, task);
      //   await this.loadGanttData();
      // } catch (error: any) {
      //   console.error('Failed to drag task:', error);
      //   this.setState({
      //     error: error.message || 'Failed to drag task'
      //   });
      // }
    });

    api.on('add-link', async (link: any) => {
      console.log('Gantt add-link', link);
      try {
        const { ganttSettingsRef } = this.props;

        if (!ganttSettingsRef) {
          console.error('No gantt settings reference provided, link not saved');
          return;
        }

        const ganttSettings = await GanttDataLoader.loadGanttSettings(ganttSettingsRef);

        if (!ganttSettings.data) {
          throw new Error('No gantt data reference found in settings');
        }

        await GanttDataLoader.createDependency(ganttSettings.data, link);
      } catch (error: any) {
        console.error('Failed to create link:', error);
        this.setState({
          error: error.message || 'Failed to create link'
        });
      }
    });

    api.on('update-link', async (link: any) => {
      console.log('gantt update-link', link);
      try {
        await GanttDataLoader.updateDependency(link.id, link);
      } catch (error: any) {
        console.error('Failed to update link:', error);
        this.setState({
          error: error.message || 'Failed to update link'
        });
      }
    });

    api.on('delete-link', async (link: any) => {
      console.log('gantt delete-link', link);
      try {
        await GanttDataLoader.deleteDependency(link.id);
      } catch (error: any) {
        console.error('Failed to delete link:', error);
        this.setState({
          error: error.message || 'Failed to delete link'
        });
      }
    });
  };

  render() {
    const { isLoading, error, tasks, links, scales } = this.state;
    const { ganttSettingsRef } = this.props;

    if (isLoading) {
      return (
        <div
          className="gantt-loader"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontSize: '16px'
          }}
        >
          Loading Gantt chart...
        </div>
      );
    }

    if (!ganttSettingsRef) {
      return <div>No Gantt settings reference provided</div>;
    }

    // eslint-disable-next-line react/react-in-jsx-scope
    return <Gantt init={this.init} tasks={tasks} taskTypes={this.taskTypes} links={links} scales={scales} />;
  }
}
