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
    style="display: flex; justify-content: center; align-items: center; height: 100%; padding: 200px;"
  >
    <svg width="80" height="80" viewBox="-20 -20 42 42" xmlns="http://www.w3.org/2000/svg" stroke="var(--primary)"><g fill="none" fill-rule="evenodd"><g transform="translate(1 1)" stroke-width="2"><circle stroke-opacity=".5" cx="0" cy="0" r="20" stroke="var(--primary)" stroke-width="2"></circle><path d="M20 0c0-9.94-8.06-20-20-20"><animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite"></animateTransform></path></g></g></svg>
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
