import React from 'react';
import isString from 'lodash/isString';

import EcosModal from '../EcosModal/EcosModal';
import { Field, MLText } from '../form';
import { Btn } from '../btns';
import { getCurrentLocale, t } from '../../../helpers/util';
import { Labels } from './constants';

class EditTabForm extends React.Component {
  getMLValue = value => {
    if (isString(value)) {
      value = {
        [getCurrentLocale()]: value
      };
    }

    return value;
  };

  render() {
    const { isOpen, isValidText, hideModal, label, onChangeLabel, onSave } = this.props;

    return (
      <EcosModal title={t(Labels.Modal.SETTINGS_MODAL_TITLE)} isOpen={isOpen} hideModal={hideModal} size="small">
        <div className="ecos-tab-settings-modal">
          <Field label={t(Labels.Modal.SETTINGS_LABEL_TITLE)} isRequired>
            <MLText value={this.getMLValue(label)} onChange={onChangeLabel} />
          </Field>
          <div className="ecos-tab-settings-modal__buttons">
            <Btn className="ecos-btn_hover_light-blue" onClick={hideModal}>
              {t(Labels.Modal.SETTINGS_MODAL_CANCEL)}
            </Btn>
            <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" disabled={!isValidText} onClick={onSave}>
              {t(Labels.Modal.SETTINGS_MODAL_SAVE)}
            </Btn>
          </div>
        </div>
      </EcosModal>
    );
  }
}

export default EditTabForm;
