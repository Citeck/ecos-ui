import React, { Component } from 'react';
import { Gantt } from 'wx-react-gantt';

import GanttDataLoader from '../services/GanttDataLoader';
import GanttDataTransformer from '../services/GanttDataTransformer';

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

// Props that might be passed to the component
interface GanttProps {
  ganttSettingsRef?: string;
  ganttDataRef?: string;
  currentRef?: string;
  workspace?: string;
}

export default class GanttWithStore extends Component<GanttProps, GanttState> {
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

  /**
   * Load Gantt data from Records API
   */
  async loadGanttData() {
    const { ganttSettingsRef } = this.props;

    if (!ganttSettingsRef) {
      this.setState({
        isLoading: false,
        tasks: [],
        links: [] 
      });
      return;
    }

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

  /**
   * Initialize Gantt API event handlers
   */
  init = (api: any) => {
    api.getState().tasks.forEach((task: any) => {
      console.log('Gantt task loaded', task);
    });

    api.on('add-task', async (task: any) => {
      console.log('gantt add-task', task);
      try {
        const { ganttSettingsRef } = this.props;
        if (!ganttSettingsRef) {
          console.log('No gantt settings reference provided, task not saved');
          return;
        }

        // First, we need to get the gantt data reference from settings
        const ganttSettings = await GanttDataLoader.loadGanttSettings(ganttSettingsRef);
        if (!ganttSettings.data) {
          throw new Error('No gantt data reference found in settings');
        }

        await GanttDataLoader.createActivity(ganttSettings.data, task);

        await this.loadGanttData();
      } catch (error: any) {
        console.error('Failed to create task:', error);
        this.setState({
          error: error.message || 'Failed to create task'
        });
      }
    });

    api.on('update-task', async (task: any) => {
      console.log('gantt update-task', task);
      try {
        const { ganttSettingsRef } = this.props;
        if (!ganttSettingsRef) {
          console.log('No gantt settings reference provided, task not updated');
          return;
        }

        await GanttDataLoader.updateActivity(task.id, task);
        await this.loadGanttData();
      } catch (error: any) {
        console.error('Failed to update task:', error);
        this.setState({
          error: error.message || 'Failed to update task'
        });
      }
    });

    api.on('delete-task', async (task: any) => {
      console.log('gantt delete-task', task);
      try {
        const { ganttSettingsRef } = this.props;
        if (!ganttSettingsRef) {
          console.log('No gantt settings reference provided, task not deleted');
          return;
        }

        await GanttDataLoader.deleteActivity(task.id);
        await this.loadGanttData();
      } catch (error: any) {
        console.error('Failed to delete task:', error);
        this.setState({
          error: error.message || 'Failed to delete task'
        });
      }
    });

    api.on('add-link', async (link: any) => {
      console.log('gantt add-link', link);
      try {
        const { ganttSettingsRef } = this.props;
        if (!ganttSettingsRef) {
          console.log('No gantt settings reference provided, link not saved');
          return;
        }

        // First, we need to get the gantt data reference from settings
        const ganttSettings = await GanttDataLoader.loadGanttSettings(ganttSettingsRef);
        if (!ganttSettings.data) {
          throw new Error('No gantt data reference found in settings');
        }

        await GanttDataLoader.createDependency(ganttSettings.data, link);
        await this.loadGanttData();
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
        const { ganttSettingsRef } = this.props;
        if (!ganttSettingsRef) {
          console.log('No gantt settings reference provided, link not updated');
          return;
        }

        await GanttDataLoader.updateDependency(link.id, link);
        await this.loadGanttData();
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
        const { ganttSettingsRef } = this.props;
        if (!ganttSettingsRef) {
          console.log('No gantt settings reference provided, link not deleted');
          return;
        }

        await GanttDataLoader.deleteDependency(link.id);
        await this.loadGanttData();
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

    // If no ganttSettingsRef is provided, show a friendly message
    if (!ganttSettingsRef) {
      return (
        <div
          className="gantt-placeholder"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontSize: '16px',
            color: '#666',
            textAlign: 'center',
            padding: '20px'
          }}
        >
          <div>
            <p>Gantt chart not configured yet.</p>
            <p>Please select or create gantt settings in the widget configuration.</p>
          </div>
        </div>
      );
    }

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

    if (error) {
      return (
        <div
          className="gantt-error"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'red',
            padding: '20px',
            textAlign: 'center'
          }}
        >
          Error: {error}
          <button
            onClick={() => this.loadGanttData()}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return <Gantt init={this.init} tasks={tasks} taskTypes={this.taskTypes} links={links} scales={scales} />;
  }
}