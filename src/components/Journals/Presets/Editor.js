import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../helpers/export/util';
import { isFilledLabelWeak } from '../../../helpers/util';
import { MLText, SelectOrgstruct } from '../../common/form';
import { Btn } from '../../common/btns';
import { GroupTypes } from '../../common/form/SelectOrgstruct/constants';
import { Labels } from '../constants';

import './style.scss';

const Editor = ({ onClose, onSave, data, id, isAdmin, ...params }) => {
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
        <div className="journal-preset-editor__label journal-preset-editor__label_required">{t(Labels.Preset.FIELD_NAME)}</div>
        <div className="journal-preset-editor__control">
          <MLText onChange={handleChangeName} value={name} />
        </div>
      </div>

      <div className="journal-preset-editor__field">
        <div className="journal-preset-editor__label journal-preset-editor__label_required">{t(Labels.Preset.FIELD_AUTH)}</div>
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
        <Btn onClick={onClose}>{t(Labels.Preset.BTN_CLOSE)}</Btn>
        <Btn onClick={handleSave} className="ecos-btn_blue" disabled={isSaving || isInvalid}>
          {t(Labels.Preset.BTN_SAVE)}
        </Btn>
      </div>
    </div>
  );
};

Editor.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.object,
    authority: PropTypes.string
  }),

  onClose: PropTypes.func,
  onSave: PropTypes.func
};

export default Editor;
