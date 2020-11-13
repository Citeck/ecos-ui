import { PROXY_URI } from '../constants/alfresco';
import { SourcesId } from '../constants';
import { CommonApi } from './common';
import Records from '../components/Records';

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
    return this.getJson(`/build-info/full.json`);
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
}
