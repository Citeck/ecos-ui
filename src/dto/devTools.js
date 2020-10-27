import omit from 'lodash/omit';
import get from 'lodash/get';

export default class DevToolsConverter {
  static fetchAlfrescoModulesList(source = {}) {
    const modules = source.modules || [];
    return modules.map(module => {
      let buildDate = '';
      const groups = module.version.match(/\d+.\d+.\d+.(\d\d).(\d{1,2}).(\d{1,2}).(\d{1,2}).(\d{1,2})/);
      if (groups) {
        buildDate = `20${groups[1]}-${groups[2]}-${groups[3]}T${groups[4]}:${groups[5]}:00Z`;
      }
      return {
        id: module.id,
        label: module.id,
        version: module.version,
        buildDate
      };
    });
  }

  static fetchSystemModulesList(source = {}) {
    const modules = Array.isArray(source.records) ? source.records : [];
    return modules.map(module => {
      return {
        id: module.label,
        label: module.label,
        version: module.version,
        buildDate: module.buildDate
      };
    });
  }

  static fetchRepos(source = []) {
    const target = {};

    source.forEach(item => {
      target[item.repo] = omit(item, ['commits']);
    });

    return target;
  }

  static normalizeCommits(source = []) {
    return source
      .map(app => {
        return app.commits.map(commit => ({
          ...commit,
          repo: app.repo,
          id: commit.commit
        }));
      })
      .reduce((acc, val) => acc.concat(val))
      .sort((a, b) => (get(a, 'committer.date') > get(b, 'committer.date') ? -1 : 1));
  }
}
