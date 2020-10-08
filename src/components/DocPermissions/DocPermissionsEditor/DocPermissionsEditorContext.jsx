import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { NotificationManager } from 'react-notifications';

import { DocPermissionsApi } from '../../../api/docPermissions';
import { t } from '../../../helpers/util';

import DocPermissionsEditorPropTypes from './DocPermissionsEditorPropTypes';

export const DocPermissionsEditorContext = React.createContext();

export const DocPermissionsEditorContextProvider = props => {
  const { controlProps } = props;
  const { record, onSave } = controlProps;

  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [matrixConfig, setMatrixConfig] = useState({});
  const [roles, setRoles] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    Promise.all([
      DocPermissionsApi.getPermissionMatrixConfig(record.id),
      DocPermissionsApi.getRoleList(record.id),
      DocPermissionsApi.getStatusList(record.id)
    ])
      .then(([matrixConfig, roles, statuses]) => {
        if (!matrixConfig || !Array.isArray(matrixConfig.permissions) || !Array.isArray(roles) || !Array.isArray(statuses)) {
          throw new Error(t('doc-permissions.load-data-error'));
        }

        setMatrixConfig(matrixConfig);
        setRoles(roles);
        setStatuses(
          statuses.map(item => {
            return {
              ...item,
              id: item.id.replace('emodel/status@', '')
            };
          })
        );
        setIsReady(true);
      })
      .catch(e => {
        setError(e.message);
      });
  }, []);

  const savePermissions = async () => {
    try {
      await DocPermissionsApi.savePermissions(matrixConfig.id, matrixConfig.permissions);
      if (typeof onSave === 'function') {
        onSave();
      }
    } catch (e) {
      NotificationManager.error(t('doc-permissions.save-permissions-error.message'), t('doc-permissions.save-permissions-error.title'));
    }
  };

  const closeEditor = () => {
    if (typeof onSave === 'function') {
      onSave();
    }
  };

  const setPermission = (roleId, docStatus, newPermission) => {
    setMatrixConfig({
      ...matrixConfig,
      permissions: matrixConfig.permissions.map(permission => {
        if (permission.role === roleId) {
          return {
            ...permission,
            statuses: {
              ...permission.statuses,
              [docStatus]: newPermission
            }
          };
        }

        return permission;
      })
    });
  };

  return (
    <DocPermissionsEditorContext.Provider
      value={{
        controlProps: {
          ...controlProps
        },
        error,
        isReady,
        matrixConfig,
        roles,
        statuses,

        setPermission,
        savePermissions,
        closeEditor
      }}
    >
      {props.children}
    </DocPermissionsEditorContext.Provider>
  );
};

DocPermissionsEditorContextProvider.propTypes = {
  controlProps: PropTypes.shape(DocPermissionsEditorPropTypes)
};
