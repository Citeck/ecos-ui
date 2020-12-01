import React, { useContext } from 'react';

import { Btn } from '../../../common/btns';
import { t } from '../../../../helpers/util';

import { TypePermissionsEditorContext } from '../TypePermissionsEditorContext';

const ButtonsPanel = () => {
  const context = useContext(TypePermissionsEditorContext);
  const { savePermissions, deletePermissions, closeEditor } = context;

  return (
    <div className="type-permissions__buttons-panel">
      <Btn onClick={closeEditor}>{t('type-permissions.cancel-button')}</Btn>
      <Btn className="ecos-btn_grey5 ecos-btn_color_dark" onClick={deletePermissions}>
        {t('type-permissions.delete-button')}
      </Btn>
      <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={savePermissions}>
        {t('type-permissions.save-button')}
      </Btn>
    </div>
  );
};

export default ButtonsPanel;
