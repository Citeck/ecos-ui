import { PROXY_URI } from '../constants/alfresco';
import { SourcesId } from '../constants';
import { getCurrentUserName } from '../helpers/util';
import Records from '../components/Records';
import { CommonApi } from './common';
import buildInfo from '../build-info';

export class DevToolsApi extends CommonApi {
  /**
   * Fetch Alfresco modules list
   *
   * @returns {Promise<[]>} Promise object represents Alfresco modules list
   */
  getAlfrescoModules = async () => {
    return this.getJson(`${PROXY_URI}modules/info.json`);
  };

  /**
   * Fetch system modules list
   *
   * @returns {Promise<[]>} Promise object represents system modules list
   */
  getSystemModules = async () => {
    return Records.query(
      {
        sourceId: SourcesId.BUILD_INFO
      },
      {
        label: 'label',
        version: 'info.version',
        buildDate: 'info.buildDate'
      }
    );
  };

  /**
   * Fetch ecos-ui commits list
   *
   * @returns {Promise<[]>} Promise object represents commits list
   */
  getUiCommits = async () => {
    return this.getJson(`/build-info/full.json?` + buildInfo.time);
  };

  /**
   * Fetch all applications commits list
   *
   * @returns {Promise<[]>} Promise object represents commits list
   */
  getAllAppsCommits = async () => {
    return Records.query(
      {
        sourceId: SourcesId.BUILD_INFO
      },
      {
        label: 'label',
        repo: 'info.repo',
        commits: 'info.commits?json'
      }
    );
  };

  getIsAccessiblePage = () => {
    return Records.get(`${SourcesId.PEOPLE}@${getCurrentUserName()}`)
      .load({ isAdmin: 'isAdmin?bool', isDevAdmin: '.att(n:"authorities"){has(n:"GROUP_DEV_TOOLS_ADMIN")}' })
      .then(({ isAdmin, isDevAdmin }) => isAdmin || isDevAdmin);
  };
}
