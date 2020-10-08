import React, { useContext } from 'react';

import { Btn } from '../../../common/btns';
import { t } from '../../../../helpers/util';

import { DocPermissionsEditorContext } from '../DocPermissionsEditorContext';

const ButtonsPanel = () => {
  const context = useContext(DocPermissionsEditorContext);
  const { savePermissions, closeEditor } = context;

  return (
    <div className="doc-permissions__buttons-panel">
      <Btn onClick={closeEditor}>{t('doc-permissions.cancel-button')}</Btn>
      <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={savePermissions}>
        {t('doc-permissions.save-button')}
      </Btn>
    </div>
  );
};

export default ButtonsPanel;
