import Records from '../components/Records';
import { CommonApi } from './common';

export class TypePermissionsApi extends CommonApi {
  /**
   * Fetch permissions matrix config by typeRef
   *
   * @typedef PermissionsDef
   *
   * @param {string} typeRef
   *
   * @returns {Promise<PermissionsDef>} Promise object represents permissions matrix config
   */
  static getTypePermissions = async typeRef => {
    return Records.queryOne(
      {
        sourceId: 'emodel/perms',
        query: { typeRef },
        language: 'type'
      },
      {
        permissions: 'permissions?json',
        attributes: 'attributes?json'
      }
    );
  };

  static deleteTypePermissions = async permissionsRef => {
    Records.remove([permissionsRef]);
  };

  /**
   * Fetch roles, statuses and type display name by typeRef
   *
   * @param {string} typeRef
   *
   * @returns {Promise<{}>} Promise object represents type info
   */
  static getTypeInfo = async typeRef => {
    let resolvedTypeRef = typeRef.replace('emodel/type@', 'emodel/rtype@');
    return Records.get(resolvedTypeRef).load(
      {
        typeDispName: '.disp',
        roles: 'model.roles[]{name,id}',
        statuses: 'model.statuses[]{name,id}',
        attributes: 'model.attributes[]{name,id}'
      },
      true
    );
  };

  /**
   * Save permissions
   *
   * @param {Object} typePermissions
   *
   * @returns {Promise}
   */
  static savePermissions = async typePermissions => {
    const matrix = Records.get(typePermissions.id);
    matrix.att('permissions?json', typePermissions.permissions);
    matrix.att('attributes?json', typePermissions.attributes);
    matrix.att('typeRef?id', typePermissions.typeRef);
    return matrix.save();
  };
}
