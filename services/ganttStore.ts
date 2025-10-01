import { writable } from 'svelte/store';

import GanttDataLoader from './ganttDataLoader';

import type { GanttTask, GanttLink } from './ganttDataTransformer';

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

interface GanttSettings {
  id?: string;
  dataType: string;
  dataSourceId?: string;
  manualDataSourceId?: string;
  linkedWithType?: string;
  linkedWithRef?: string;
  data?: string;
}

function createGanttStore() {
  const { subscribe, set, update } = writable<GanttState>({
    tasks: [],
    links: [],
    scales: [
      { unit: 'month', step: 1, format: 'MMMM yyyy' },
      { unit: 'day', step: 1, format: 'd' }
    ],
    isLoading: true,
    error: undefined
  });

  let ganttSettingsRef: string | undefined = undefined;
  let currentRef: string | undefined = undefined;
  let workspace: string | undefined = undefined;

  // Helper function to load data with settings
  const loadGanttDataWithSettings = async (settingsRef: string) => {
    try {
      update(state => ({ ...state, isLoading: true, error: undefined }));

      const ganttSettings = await GanttDataLoader.loadGanttSettings(settingsRef);

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
          const settingsRecord = Records.getRecordToEdit(settingsRef);
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
          currentRef || '',
          workspace || ''
        );
        tasks = result.tasks;
        links = result.links;
      } else {
        update(() => ({
          tasks: [],
          links: [],
          scales: [
            { unit: 'month', step: 1, format: 'MMMM yyyy' },
            { unit: 'day', step: 1, format: 'd' }
          ],
          isLoading: false,
          error: 'Unknown gantt data type'
        }));
        return;
      }

      update(() => ({
        tasks,
        links,
        scales: [
          { unit: 'month', step: 1, format: 'MMMM yyyy' },
          { unit: 'day', step: 1, format: 'd' }
        ],
        isLoading: false,
        error: undefined
      }));
    } catch (error: any) {
      console.error('Failed to load Gantt data:', error);
      update(() => ({
        tasks: [],
        links: [],
        scales: [
          { unit: 'month', step: 1, format: 'MMMM yyyy' },
          { unit: 'day', step: 1, format: 'd' }
        ],
        isLoading: false,
        error: error.message || 'Failed to load Gantt data'
      }));
    }
  };

  return {
    subscribe,

    setRefs: (settingsRef: string | undefined, current: string | undefined, ws: string | undefined) => {
      ganttSettingsRef = settingsRef;
      currentRef = current;
      workspace = ws;
    },

    loadGanttData: async () => {
      if (!ganttSettingsRef) {
        try {
          // @ts-ignore
          const newSettingsRecord = Records.get('emodel/gantt-settings@');
          newSettingsRecord.att('dataType', 'STANDALONE');

          const result = await newSettingsRecord.save();

          await loadGanttDataWithSettings(result.id);
        } catch (error: any) {
          console.error('Failed to create default Gantt settings:', error);
          update(() => ({
            tasks: [],
            links: [],
            scales: [
              { unit: 'month', step: 1, format: 'MMMM yyyy' },
              { unit: 'day', step: 1, format: 'd' }
            ],
            isLoading: false,
            error: error.message || 'Failed to create default Gantt settings'
          }));
        }
        return;
      }

      await loadGanttDataWithSettings(ganttSettingsRef);
    },

    loadGanttDataWithSettings,

    createTask: async (task: any) => {
      try {
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
        update(state => ({ ...state, error: error.message || 'Failed to create task' }));
      }
    },

    updateTask: async (task: any) => {
      try {
        if (!ganttSettingsRef) {
          return;
        }

        await GanttDataLoader.updateActivity(task.id, task);
      } catch (error: any) {
        console.error('Failed to update task:', error);
        update(state => ({ ...state, error: error.message || 'Failed to update task' }));
      }
    },

    deleteTask: async (task: any) => {
      try {
        await GanttDataLoader.deleteActivity(task.id);
      } catch (error: any) {
        console.error('Failed to delete task:', error);
        update(state => ({ ...state, error: error.message || 'Failed to delete task' }));
      }
    },

    createLink: async (link: any) => {
      try {
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
        update(state => ({ ...state, error: error.message || 'Failed to create link' }));
      }
    },

    updateLink: async (link: any) => {
      try {
        await GanttDataLoader.updateDependency(link.id, link);
      } catch (error: any) {
        console.error('Failed to update link:', error);
        update(state => ({ ...state, error: error.message || 'Failed to update link' }));
      }
    },

    deleteLink: async (link: any) => {
      try {
        await GanttDataLoader.deleteDependency(link.id);
      } catch (error: any) {
        console.error('Failed to delete link:', error);
        update(state => ({ ...state, error: error.message || 'Failed to delete link' }));
      }
    }
  };
}

export const ganttStore = createGanttStore();
