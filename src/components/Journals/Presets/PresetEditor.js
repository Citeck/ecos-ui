import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../helpers/export/util';
import { isFilledLabelWeak } from '../../../helpers/util';
import { MLText, SelectOrgstruct } from '../../common/form';
import { Btn } from '../../common/btns';
import { GroupTypes } from '../../common/form/SelectOrgstruct/constants';

import './style.scss';

export const Labels = {
  TITLE_CREATE: 'journal.presets.modal.title.create',
  TITLE_EDIT: 'journal.presets.modal.title.edit',
  FIELD_NAME: 'journal.presets.modal.field.name',
  FIELD_AUTH: 'journal.presets.modal.field.authority',
  BTN_CLOSE: 'journal.presets.modal.btn.cancel',
  BTN_SAVE: 'journal.presets.modal.btn.save'
};

const PresetEditor = ({ onClose, onSave, data, id, isAdmin, ...params }) => {
  const [name, setName] = useState({});
  const [authorityRef, setAuthorityRef] = useState('');
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    setName(data.name);
    setAuthorityRef(params.authorityRef);
  }, [id, data.name, params.authorityRef]);

  const handleChangeName = useCallback(name => setName(name), []);
  const handleChangeAuthority = useCallback(authorityRef => setAuthorityRef(authorityRef), []);
  const handleSave = useCallback(() => {
    setSaving(true);
    onSave({ name, authorityRef });
  }, [name, authorityRef]);

  const isInvalid = !(isFilledLabelWeak(name) && authorityRef);

  return (
    <div className="journal-journal-preset-editor">
      <div className="journal-preset-editor__field">
        <div className="journal-preset-editor__label journal-preset-editor__label_required">{t(Labels.FIELD_NAME)}</div>
        <div className="journal-preset-editor__control">
          <MLText onChange={handleChangeName} value={name} />
        </div>
      </div>

      <div className="journal-preset-editor__field">
        <div className="journal-preset-editor__label journal-preset-editor__label_required">{t(Labels.FIELD_AUTH)}</div>
        <div className="journal-preset-editor__control">
          <SelectOrgstruct
            defaultValue={authorityRef}
            disabled={!isAdmin}
            isSelectedValueAsText
            isIncludedAdminGroup={isAdmin}
            allowedGroupTypes={Object.values(GroupTypes)}
            onChange={handleChangeAuthority}
          />
        </div>
      </div>

      <div className="journal-preset-editor__buttons">
        <Btn onClick={onClose}>{t(Labels.BTN_CLOSE)}</Btn>
        <Btn onClick={handleSave} className="ecos-btn_blue" disabled={isSaving || isInvalid}>
          {t(Labels.BTN_SAVE)}
        </Btn>
      </div>
    </div>
  );
};

PresetEditor.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.object,
    authority: PropTypes.string
  }),

  onClose: PropTypes.func,
  onSave: PropTypes.func
};

export default PresetEditor;
