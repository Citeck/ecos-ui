import React from 'react';

import { t } from '../../../helpers/util';
import { Btn } from '../btns';

import './style.scss';

export const SaveAndCancelButtons = ({ saveText, handleSave, handleCancel, disabledSave, loading }) => {
  return (
    <div className="buttons-wrapper">
      <Btn className="ecos-btn_x-step_10" onClick={handleCancel}>
        {t('btn.cancel.label')}
      </Btn>
      <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" disabled={disabledSave} loading={loading} onClick={handleSave}>
        {saveText || t('btn.save.label')}
      </Btn>
    </div>
  );
};
