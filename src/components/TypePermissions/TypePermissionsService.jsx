import React from 'react';

import DialogManager from '../common/dialogs/Manager';
import { t } from '../../helpers/util';

import TypePermissionsEditor from './TypePermissionsEditor';

import { TypePermissionsApi } from '../../api/typePermissions';

export default class TypePermissionsService {
  static async editTypePermissions(typeRef) {
    return TypePermissionsService._editPermissions(
      typeRef,
      typePerms => typePerms.permissions,
      (typePerms, permsDef) => (typePerms.permissions = permsDef),
      typePerms => (typePerms.permissions = { matrix: {}, rules: [] })
    );
  }

  static async editTypeAttPermissions(typeRef, attribute) {
    return TypePermissionsService._editPermissions(
      typeRef,
      typePerms => typePerms.attributes[attribute],
      (typePerms, permsDef) => (typePerms.attributes[attribute] = permsDef),
      typePerms => delete typePerms.attributes[attribute]
    );
  }

  static async _editPermissions(typeRef, permsDefGetter, permsDefSetter, permsDefDelete) {
    let permsData = await TypePermissionsService._getTypePermissionsData(typeRef);
    let typePermissions = permsData.typePermissions;

    let title = t('type-permissions.modal-title', { type: permsData.typeDispName });

    return new Promise(resolve => {
      this.openEditor({
        title,
        permissionsDef: permsDefGetter(typePermissions) || {},
        roles: permsData.roles,
        statuses: permsData.statuses,
        onSave: async permissionsDef => {
          permsDefSetter(typePermissions, permissionsDef);
          typePermissions.typeRef = typeRef;
          await TypePermissionsApi.savePermissions(typePermissions);
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
        onDelete: async () => {
          permsDefDelete(typePermissions);
          await TypePermissionsApi.savePermissions(typePermissions);
          resolve(true);
        }
      });
    });
  }

  static _getTypePermissionsData = async typeRef => {
    try {
      return {
        typePermissions: await TypePermissionsApi.getTypePermissions(typeRef),
        ...(await TypePermissionsApi.getTypeInfo(typeRef))
      };
    } catch (e) {
      console.error(e);
      throw new Error(t('type-permissions.load-data-error'));
    }
  };

  static openEditor({ title, permissionsDef, roles, statuses, onSave, onCancel, onDelete }) {
    if (!permissionsDef || !Array.isArray(roles) || !Array.isArray(statuses)) {
      throw new Error(t('type-permissions.load-data-error'));
    }

    const dialog = DialogManager.showCustomDialog({
      isVisible: true,
      title,
      body: (
        <TypePermissionsEditor
          permissionsDef={permissionsDef}
          roles={roles}
          statuses={statuses}
          onSave={async permissionsDef => {
            await onSave(permissionsDef);
            dialog.setVisible(false);
          }}
          onCancel={() => {
            dialog.setVisible(false);
            onCancel();
          }}
          onDelete={() => {
            dialog.setVisible(false);
            onDelete();
          }}
        />
      ),
      modalClass: 'ecos-modal_width-auto ecos-dialog_no-buttons',
      reactstrapProps: {
        backdrop: 'static'
      }
    });
  }
}
