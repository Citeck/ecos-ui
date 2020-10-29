import DevToolsConverter from '../../../dto/devTools';

import { JIRA } from '../Commits/constants';
import { getRepoProject, parseTasksLinks } from '../Commits/helpers';
import { input1, output1, input2, output2, input3_4, output3, output4 } from '../__mocks__/DevTools.mock';

describe('DevTools tests', () => {
  describe('DevToolsConverter', () => {
    it('fetchAlfrescoModulesList', () => {
      expect(DevToolsConverter.fetchAlfrescoModulesList(input1)).toEqual(output1);
    });
    it('fetchSystemModulesList', () => {
      expect(DevToolsConverter.fetchSystemModulesList(input2)).toEqual(output2);
    });
    it('fetchRepos', () => {
      expect(DevToolsConverter.fetchRepos(input3_4)).toEqual(output3);
    });
    it('normalizeCommits', () => {
      expect(DevToolsConverter.normalizeCommits(input3_4)).toEqual(output4);
    });
  });

  describe('Commits helpers', () => {
    it('getRepoProject', () => {
      expect(getRepoProject('git@bitbucket.org:citeck/ecos-ui.git')).toEqual('citeck/ecos-ui');
      expect(getRepoProject('git@bitbucket.org:citeck/ecos-uiserv.git')).toEqual('citeck/ecos-uiserv');
    });
    it('parseTasksLinks', () => {
      const input1 = 'ECOSCOM-3940 - category-document-type does not have "Delete" and "View in browser" actions';
      const output1 = `<a href='${JIRA}ECOSCOM-3940' target='_blank' class='commits-grid__link'>ECOSCOM-3940</a> - category-document-type does not have "Delete" and "View in browser" actions`;
      expect(parseTasksLinks(input1)).toEqual(output1);

      const input2 = 'Merged into bugfix/ECOSUI-569-2 (pull-request #797)';
      const output2 = `Merged into bugfix/<a href='${JIRA}ECOSUI-569' target='_blank' class='commits-grid__link'>ECOSUI-569</a>-2 (pull-request #797)`;
      expect(parseTasksLinks(input2)).toEqual(output2);
    });
  });
});
