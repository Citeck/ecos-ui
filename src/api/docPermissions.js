import Records from '../components/Records';
import { CommonApi } from './common';

export class DocPermissionsApi extends CommonApi {
  /**
   * Fetch permissions matrix config by recordRef
   *
   * @param {string} recordRef
   *
   * @returns {Promise<{}>} Promise object represents permissions matrix config
   */
  static getPermissionMatrixConfig = async recordRef => {
    return Records.get(recordRef).load('docPermRef?json', true);
  };

  /**
   * Fetch roles list by recordRef
   *
   * @param {string} recordRef
   *
   * @returns {Promise<[]>} Promise object represents roles list
   */
  static getRoleList = async recordRef => {
    return Records.get(recordRef).load('roles[]?{name,roleId}', true);
  };

  /**
   * Fetch status list by recordRef
   *
   * @param {string} recordRef
   *
   * @returns {Promise<[]>} Promise object represents status list
   */
  static getStatusList = async recordRef => {
    return Records.query(
      {
        sourceId: 'emodel/status',
        query: { typeRef: recordRef }
      },
      ['name']
    ).then(res => {
      if (!res.totalCount) {
        return [];
      }
      return res.records;
    });
  };

  /**
   * Save permissions
   *
   * @param {string} configId
   * @param {string} permissions - permission matrix. Example: [{"role":"initiator","statuses":{"new":"WRITE"}}, ...]
   *
   * @returns {Promise}
   */
  static savePermissions = async (configId, permissions) => {
    const matrix = Records.get(`emodel/docperm@${configId}`);
    matrix.att('permissions?json', permissions);
    return matrix.save();
  };
}
