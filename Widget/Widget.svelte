<script>
  import { onMount } from 'svelte';
  import { Locale } from "@svar-ui/svelte-core";
  import { Gantt, Editor, Willow } from "@svar-ui/svelte-gantt";

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

    api.on('add-task', async (task) => {
      console.log('hui Gantt add-task', task);
      await ganttStore.createTask(task);
    });

    api.on('update-task', async (task) => {
      console.log('hui Gantt update-task', task);
      await ganttStore.updateTask(task);
    });

    api.on('delete-task', async (task) => {
      console.log('hui Gantt delete-task', task);
      await ganttStore.deleteTask(task);
    });

    api.on('add-link', async (link) => {
      console.log('hui Gantt add-link', link);
      await ganttStore.createLink(link);
    });


    api.on('update-link', async (link) => {
      console.log('hui Gantt update-link', link);
      await ganttStore.updateLink(link);
    });

    api.on('delete-link', async (link) => {
      // console.log('hui Gantt delete-link', link);
      await ganttStore.deleteLink(link);
    });
  }
</script>

{#if $ganttStore.isLoading}
  <div
    class="gantt-loader"
    style="display: flex; justify-content: center; align-items: center; height: 100%; font-size: 16px;"
  >
    Loading Gantt chart...
  </div>
{:else if !$ganttStore.tasks && !ganttSettingsRef}
  <div>No Gantt settings reference provided</div>
{:else}
<Locale words={words}>
  <Gantt
    tasks={$ganttStore.tasks}
    links={$ganttStore.links}
    scales={$ganttStore.scales}
    init={init}
  />
  <Willow>
    <Editor api={widgetApi} placement="sidebar" />
  </Willow>
</Locale>
{/if}
