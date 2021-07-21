import { PROXY_URI } from '../constants/alfresco';
import { SourcesId } from '../constants';
import { getCurrentUserName } from '../helpers/util';
import Records from '../components/Records';
import { CommonApi } from './common';

export class DevToolsApi extends CommonApi {
  /**
   * Fetch Alfresco modules list
   *
   * @returns {Promise<[]>} Promise object represents Alfresco modules list
   */
  getAlfrescoModules = async () => {
    return this.getJson(`${PROXY_URI}modules/info.json`);
  };

  _getBuildInfoImpl = async atts => {
    let res = null;
    try {
      res = await Records.query(
        {
          sourceId: SourcesId.EAPPS_BUILD_INFO
        },
        atts
      );
    } catch (e) {
      console.error('build info fetch error', e);
    }
    if (!res || !res.records || !res.records.length) {
      res = await Records.query(
        {
          sourceId: SourcesId.UISERV_BUILD_INFO
        },
        atts
      );
    }
    if (res && res.records && atts.commits) {
      res.records.forEach(r => {
        if (r.commits && r.commits.length === 1 && Array.isArray(r.commits[0])) {
          r.commits = r.commits[0];
        }
      });
    }
    return res;
  };

  /**
   * Fetch system modules list
   *
   * @returns {Promise<[]>} Promise object represents system modules list
   */
  getSystemModules = async () => {
    return this._getBuildInfoImpl({
      label: 'label',
      version: 'info.version',
      buildDate: 'info.buildDate'
    });
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
    return this._getBuildInfoImpl({
      label: 'label',
      repo: 'info.repo',
      commits: 'info.commits[]?json'
    });
  };

  getIsAccessiblePage = () => {
    return Records.get(`${SourcesId.PEOPLE}@${getCurrentUserName()}`)
      .load({ isAdmin: 'isAdmin?bool', isDevAdmin: '.att(n:"authorities"){has(n:"GROUP_DEV_TOOLS_ADMIN")}' })
      .then(({ isAdmin, isDevAdmin }) => isAdmin || isDevAdmin);
  };
}
