import React from 'react';

import DialogManager from '../common/dialogs/Manager';
import { t } from '../../helpers/util';

import TypePermissionsEditor from './TypePermissionsEditor';

import { TypePermissionsApi } from '../../api/typePermissions';
import DownloadAction from '../Records/actions/handler/executor/DownloadAction';
import { formatPermissionsConfig } from './helpers/formatPermissionsMatrix';

export default class TypePermissionsService {
  static async editTypePermissions(typeRef, customPermsData = {}) {
    return TypePermissionsService._editPermissions(
      typeRef,
      customPermsData,
      typePerms => typePerms.permissions,
      (typePerms, permsDef) => (typePerms.permissions = permsDef),
      typePerms => (typePerms.permissions = { matrix: {}, rules: [] })
    );
  }

  static async editTypeAttPermissions(typeRef, attribute, customPermsData = {}) {
    if (!attribute) {
      DialogManager.showInfoDialog({
        title: 'type-permissions.empty-attribute.title',
        text: 'type-permissions.empty-attribute.text'
      });
      return false;
    }

    customPermsData.attributeName = customPermsData.attributeName || attribute;

    return TypePermissionsService._editPermissions(
      typeRef,
      customPermsData,
      typePerms => typePerms.attributes[attribute],
      (typePerms, permsDef) => (typePerms.attributes[attribute] = permsDef),
      typePerms => delete typePerms.attributes[attribute]
    );
  }

  static async downloadPermissionsConfig(typeRef, roles, statuses, attributes) {
    let typePermissions = await TypePermissionsApi.getTypePermissions(typeRef);
    if (!typePermissions) {
      throw new Error(t('type-permissions.load-data-error'));
    }

    roles = roles.filter(r => !!r.id);
    statuses = statuses.filter(s => !!s.id);

    const { id, ...permsConfigRest } = formatPermissionsConfig(typePermissions, roles, statuses, attributes);

    const matrix = {
      id: id.substring(id.indexOf('@') + 1),
      typeRef: typeRef,
      ...permsConfigRest
    };
    let filename = typeRef.substring(typeRef.indexOf('@') + 1) + '-permissions.json';

    DownloadAction._downloadText(JSON.stringify(matrix, null, '  '), filename, 'text/json');
  }

  static async _editPermissions(typeRef, customPermsData, permsDefGetter, permsDefSetter, permsDefDelete) {
    let permsData = await TypePermissionsService._getTypePermissionsData(typeRef);
    if (customPermsData) {
      permsData = Object.assign({}, permsData, customPermsData);
    }

    let roles = (permsData.roles || []).filter(r => !!r.id);
    let statuses = (permsData.statuses || []).filter(s => !!s.id);

    if (!roles.length) {
      DialogManager.showInfoDialog({
        title: 'type-permissions.empty-roles.title',
        text: 'type-permissions.empty-roles.text'
      });
      return false;
    } else if (!statuses.length) {
      DialogManager.showInfoDialog({
        title: 'type-permissions.empty-statuses.title',
        text: 'type-permissions.empty-statuses.text'
      });
      return false;
    }

    let typePermissions = permsData.typePermissions;

    let title;
    if (permsData.attributeName) {
      title = t('type-permissions.attribute.modal-title', { attribute: permsData.attributeName });
    } else {
      title = t('type-permissions.type.modal-title', { type: permsData.typeDispName });
    }

    return new Promise(resolve => {
      this.openEditor({
        title,
        permissionsDef: permsDefGetter(typePermissions) || {},
        roles,
        statuses,
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

window.Citeck = window.Citeck || {};
if (!window.Citeck.TypePermissionsService) {
  window.Citeck.TypePermissionsService = TypePermissionsService;
}
