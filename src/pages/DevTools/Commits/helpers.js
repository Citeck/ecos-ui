import { JIRA } from './constants';

const repoRegex = /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/;
const taskRegex = /[A-Z]+-[0-9]+/g;

export function getRepoProject(url) {
  const parts = url.match(repoRegex);
  if (!parts) {
    return null;
  }

  return parts[7];
}

export function parseTasksLinks(str) {
  return str.replace(taskRegex, taskId => {
    return `<a href='${JIRA}${taskId}' target='_blank' class='commits-grid__link'>${taskId}</a>`;
  });
}
