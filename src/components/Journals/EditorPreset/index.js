import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../helpers/export/util';
import { EcosModal } from '../../common';
import { Input, SelectOrgstruct } from '../../common/form';
import { Btn } from '../../common/btns';
import { GroupTypes } from '../../common/form/SelectOrgstruct/constants';

import './style.scss';

const Labels = {
  TITLE: 'journals.action.dialog-msg',
  FIELD_NAME: '',
  FIELD_AUTH: '',
  BTN_CLOSE: 'journals.action.cancel',
  BTN_SAVE: 'journals.action.save'
};

const EditorPreset = ({ onClose, onSave, data, id }) => {
  const [name, setName] = useState('');
  const [authority, setAuthority] = useState('');

  useEffect(() => {
    setName(data.name);
    setAuthority(data.authority);
  }, [id, data.name, data.authority]);

  const handleChangeName = useCallback(e => setName(e.target.value), []);
  const handleChangeAuthority = useCallback((allowedRefs, items) => setAuthority(allowedRefs), []);

  return (
    <EcosModal isOpen title={t(Labels.TITLE)} size="sm" className="journal__dialog-preset" hideModal={onClose}>
      <div className="preset-editor__field">
        <div className="preset-editor__label">Name</div>
        <div className="preset-editor__control">
          <Input type="text" value={name} onChange={handleChangeName} />
        </div>
      </div>

      <div className="preset-editor__field">
        <div className="preset-editor__label">for who</div>
        <div className="preset-editor__control">
          <SelectOrgstruct
            isLoading={1}
            defaultValue={authority}
            multiple={false}
            isSelectedValueAsText
            isIncludedAdminGroup
            placeholder={t(1)}
            allowedGroupTypes={Object.values(GroupTypes)}
            onChange={handleChangeAuthority}
          />
        </div>
      </div>

      <div className="preset-editor__buttons">
        <Btn onClick={onClose}>{t(Labels.BTN_CLOSE)}</Btn>
        <Btn onClick={onSave} className="ecos-btn_blue">
          {t(Labels.BTN_SAVE)}
        </Btn>
      </div>
    </EcosModal>
  );
};

EditorPreset.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.string,
    authority: PropTypes.string
  }),

  onClose: PropTypes.func,
  onSave: PropTypes.func
};

export default EditorPreset;
