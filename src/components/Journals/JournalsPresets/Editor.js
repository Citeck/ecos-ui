import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import { Btn } from '../../common/btns';
import { MLText, SelectOrgstruct } from '../../common/form';
import { GroupTypes } from '../../common/form/SelectOrgstruct/constants';
import { Labels } from '../constants';

import { t } from '@/helpers/export/util';
import { isFilledLabelWeak } from '@/helpers/util';

import './style.scss';

const Editor = ({ onClose, onSave, data, id, isAdmin, ...params }) => {
  const [name, setName] = useState({});
  const [authorityRef, setAuthorityRef] = useState('');
  const [authoritiesRef, setAuthoritiesRef] = useState(['']);
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    setName(data.name);
    setAuthorityRef(params.authorityRef);
    setAuthoritiesRef(params.authoritiesRef);
  }, [id, data.name, params.authorityRef, params.authoritiesRef]);

  const handleChangeName = useCallback(name => setName(name), []);
  const handleChangeAuthorities = useCallback(authoritiesRef => setAuthoritiesRef(authoritiesRef), []);
  const handleSave = useCallback(() => {
    setSaving(true);
    onSave({ name, authorityRef, authoritiesRef });
  }, [name, authorityRef, authoritiesRef]);

  const isInvalid = !(isFilledLabelWeak(name) && Array.isArray(authoritiesRef) && authoritiesRef.length > 0);

  return (
    <div className="journal-preset-editor">
      <div className="journal-preset-editor__field">
        <div className="journal-preset-editor__label journal-preset-editor__label_required">{t(Labels.Preset.FIELD_NAME)}</div>
        <div className="journal-preset-editor__control">
          <MLText className="fitnesse-journal-preset-editor__name" onChange={handleChangeName} value={name} />
        </div>
      </div>

      <div className="journal-preset-editor__field">
        <div className="journal-preset-editor__label journal-preset-editor__label_required">
          {t(Labels.Preset.FIELD_AUTH) || t(Labels.Preset.FIELD_ALL_AUTH)}
        </div>
        <div className="journal-preset-editor__control">
          <SelectOrgstruct
            defaultValue={authoritiesRef}
            isSelectedValueAsText
            isIncludedAdminGroup={isAdmin}
            allowedGroupTypes={Object.values(GroupTypes)}
            onChange={handleChangeAuthorities}
            multiple={true}
          />
        </div>
      </div>

      <div className="journal-preset-editor__buttons">
        <Btn onClick={onClose}>{t(Labels.Preset.BTN_CLOSE)}</Btn>
        <Btn onClick={handleSave} className="ecos-btn_blue fitnesse-journal-preset-editor__buttons_save" disabled={isSaving || isInvalid}>
          {t(Labels.Preset.BTN_SAVE)}
        </Btn>
      </div>
    </div>
  );
};

Editor.propTypes = {
  data: PropTypes.shape({
    name: PropTypes.object,
    authority: PropTypes.string,
    authorities: PropTypes.arrayOf(PropTypes.string)
  }),

  onClose: PropTypes.func,
  onSave: PropTypes.func
};

export default Editor;
