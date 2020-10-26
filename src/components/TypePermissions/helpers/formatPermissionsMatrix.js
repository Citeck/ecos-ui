import _ from 'lodash';
import { TYPE_PERM_READ } from '../constants';

export const formatPermissions = (permissions, roles, statuses, options = {}) => {
  const result = _.cloneDeep(permissions);
  result.matrix = formatPermissionsMatrix(result.matrix, roles, statuses, options);
  return result;
};

export const formatPermissionsMatrix = (matrix, roles, statuses, options = {}) => {
  if (!matrix) {
    matrix = {};
  }

  if (!options.fillEmptyMatrix && !Object.keys(matrix).length) {
    return matrix;
  }

  const resultMatrix = {};

  for (let role of roles) {
    let roleData = matrix[role.id] || {};
    let newRoleData = {};
    for (let status of statuses) {
      newRoleData[status.id] = roleData[status.id] || TYPE_PERM_READ;
    }
    resultMatrix[role.id] = newRoleData;
  }

  return resultMatrix;
};

export const formatPermissionsConfig = (permissionsConfig, roles, statuses, attributes, options = {}) => {
  const resultConfig = _.cloneDeep(permissionsConfig);
  resultConfig.permissions = formatPermissions(resultConfig.permissions, roles, statuses, options);

  const attributesPermissions = _.get(permissionsConfig, 'attributes', {});
  const newAttributes = {};

  for (let att of attributes) {
    const currentPermissions = attributesPermissions[att.id];

    if (currentPermissions && (Object.keys(currentPermissions.matrix || {}).length > 0 || (currentPermissions.rules || []).length > 0)) {
      newAttributes[att.id] = formatPermissions(currentPermissions, roles, statuses, options);
    }
  }
  resultConfig.attributes = newAttributes;

  return resultConfig;
};
