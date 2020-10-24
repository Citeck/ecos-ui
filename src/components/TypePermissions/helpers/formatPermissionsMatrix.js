import _ from 'lodash';
import { TYPE_PERM_READ } from '../constants';

export const formatPermissionsMatrix = (matrix, roles, statuses) => {
  if (!matrix) {
    matrix = {};
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

export const formatPermissions = (permissions, roles, statuses) => {
  const result = _.cloneDeep(permissions);
  result.matrix = formatPermissionsMatrix(result.matrix, roles, statuses);
  return result;
};

export const formatPermissionsConfig = (permissionsConfig, roles, statuses, attributes) => {
  const resultConfig = _.cloneDeep(permissionsConfig);
  resultConfig.permissions = formatPermissions(resultConfig.permissions, roles, statuses);

  const attributesPermissions = _.get(permissionsConfig, 'attributes', {});
  const newAttributes = {};
  for (let att of attributes) {
    const currentPermissions = attributesPermissions[att.id];
    if (currentPermissions) {
      newAttributes[att.id] = formatPermissions(currentPermissions, roles, statuses);
    }
  }
  resultConfig.attributes = newAttributes;

  return resultConfig;
};
