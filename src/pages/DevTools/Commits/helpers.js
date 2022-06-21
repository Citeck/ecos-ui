import { JIRA } from './constants';

const repoRegex = /(git|ssh|https?|git@([-\w.]+)):(\/\/)?(.*?)(?:\.git)/;
const taskRegex = /[A-Z]+-[0-9]+/g;

export function matchUrl(url, part = null) {
  const parts = url.match(repoRegex);

  if (!parts) {
    return null;
  }

  if (typeof part === 'number') {
    return parts[part];
  }

  return parts;
}

export function getRepoProject(url) {
  return matchUrl(url, 4);
}

export function getHostName(url) {
  return matchUrl(url, 2);
}

export function parseTasksLinks(str) {
  return str.replace(taskRegex, taskId => {
    return `<a href='${JIRA}${taskId}' target='_blank' class='commits-grid__link'>${taskId}</a>`;
  });
}
