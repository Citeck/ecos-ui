import React, { useState } from 'react';
import PropTypes from 'prop-types';

import TypePermissionsEditorPropTypes from './TypePermissionsEditorPropTypes';
import dialogManager from '../../common/dialogs/Manager/DialogManager';
import { formatPermissionsMatrix } from '../helpers/formatPermissionsMatrix';
import { TypePermissionsEditorContext } from './Context';

export const TypePermissionsEditorContextProvider = props => {
  const { controlProps } = props;
  const { onSave, onCancel, onDelete, roles, statuses } = controlProps;

  const matrix = formatPermissionsMatrix(controlProps.permissionsDef.matrix, roles, statuses, {
    fillEmptyMatrix: true
  });
  const [matrixConfig, setMatrixConfig] = useState(matrix);

  const savePermissions = async () => {
    if (typeof onSave === 'function') {
      onSave({
        ...controlProps.permissionsDef,
        matrix: matrixConfig
      });
    }
  };

  const deletePermissions = async () => {
    dialogManager.showRemoveDialog({
      title: 'type-permissions.delete.modal-title',
      text: 'type-permissions.delete.modal-text',
      isWaitResponse: true,
      onDelete: async () => {
        if (typeof onDelete === 'function') {
          onDelete();
        }
      }
    });
  };

  const closeEditor = () => {
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  const setPermission = (roleId, docStatus, newPermission) => {
    setMatrixConfig({
      ...matrixConfig,
      [roleId]: {
        ...matrixConfig[roleId],
        [docStatus]: newPermission
      }
    });
  };

  return (
    <TypePermissionsEditorContext.Provider
      value={{
        controlProps: {
          ...controlProps
        },
        isReady: true,
        matrixConfig,

        roles,
        statuses,

        setPermission,
        savePermissions,
        deletePermissions,
        closeEditor
      }}
    >
      {props.children}
    </TypePermissionsEditorContext.Provider>
  );
};

TypePermissionsEditorContextProvider.propTypes = {
  controlProps: PropTypes.shape(TypePermissionsEditorPropTypes)
};
