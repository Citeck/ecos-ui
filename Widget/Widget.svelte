<script>
  import { onMount } from 'svelte';
  import { Locale } from "@svar-ui/svelte-core";
  import { Gantt, Editor, Material, Tooltip } from "@svar-ui/svelte-gantt";

  import { ganttStore } from '../services/ganttStore';
  import { ru, en } from '../i18n';
  import { getCurrentLocale } from '@/helpers/export/util';

  let { ganttSettingsRef = $bindable(), currentRef = $bindable(), workspace = $bindable() } = $props();

  let widgetApi = $state();
  let locale = getCurrentLocale();
  let words = locale === 'ru' ? ru : en;

  ganttStore.setRefs(ganttSettingsRef, currentRef, workspace);

  $effect.pre(() => {
    if (!ganttSettingsRef) {
      return;
    }

    ganttStore.loadGanttData();
  });

  function init(api) {
    widgetApi = api;

    // Per-task update queues: Map<taskId, { inProgress: boolean, pending: any|null }>
    const taskUpdateQueues = new Map();

    widgetApi.on('add-task', async (task) => {
      const state = widgetApi.getState();
      const newTask = await ganttStore.createTask(task, state._tasks.length + 1);
      await widgetApi.exec("update-task", { id: task.id, task: { id: newTask.id } });
      await widgetApi.exec("delete-task", { id: task.id, });
      widgetApi.exec("show-editor", { id: newTask.id});
    });

    widgetApi.on('update-task', async (task) => {
      const taskId = task && (task.id ?? task.task?.id);

      if (!taskId) {
        await ganttStore.updateTask(task);
        return;
      }

      let queue = taskUpdateQueues.get(taskId);

      if (!queue) {
        queue = { inProgress: false, pending: null };
        taskUpdateQueues.set(taskId, queue);
      }

      if (queue.inProgress) {
        queue.pending = task;
        return;
      }

      queue.inProgress = true;

      try {
        let current = task;

        while (current) {
          try {
            await ganttStore.updateTask(current);
          } catch (err) {
            throw err;
          }

          if (queue.pending) {
            current = queue.pending;
            queue.pending = null;
          } else {
            current = null;
          }
        }
      } finally {
        queue.inProgress = false;

        if (!queue.pending) {
          taskUpdateQueues.delete(taskId);
        }
      }
    });

    widgetApi.on('delete-task', async (task) => {
      await ganttStore.deleteTask(task);
    });

    widgetApi.intercept("sort-tasks", (config) => {
      return config.key == "start";
    });

    widgetApi.on('move-task', async (action) => {
      if (action.inProgress) return;

      const state = widgetApi.getState();
    });

    widgetApi.on('add-link', async (link) => {
      await ganttStore.createLink(link);
    });

    widgetApi.on('update-link', async (link) => {
      await ganttStore.updateLink(link);
    });

    widgetApi.on('delete-link', async (link) => {
      await ganttStore.deleteLink(link);
    });
  }
</script>

{#if $ganttStore.isLoading}
  <div
    class="gantt-loader"
    style="display: flex; justify-content: center; align-items: center; height: 100%; padding: 200px;"
  >
    <svg width="80" height="80" viewBox="-20 -20 42 42" xmlns="http://www.w3.org/2000/svg" stroke="var(--primary)"><g fill="none" fill-rule="evenodd"><g transform="translate(1 1)" stroke-width="2"><circle stroke-opacity=".5" cx="0" cy="0" r="20" stroke="var(--primary)" stroke-width="2"></circle><path d="M20 0c0-9.94-8.06-20-20-20"><animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite"></animateTransform></path></g></g></svg>
  </div>
{:else if !$ganttStore.tasks && !ganttSettingsRef}
  <div>No Gantt settings reference provided</div>
{:else}
<Locale words={words}>
  <Tooltip api={widgetApi}>
    <Gantt
      tasks={$ganttStore.tasks}
      links={$ganttStore.links}
      scales={$ganttStore.scales}
      init={init}
    />
    <Material>
      <Editor api={widgetApi} placement="sidebar" />
    </Material>
  </Tooltip>
</Locale>
{/if}
