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
  const [authoritiesRef, setAuthoritiesRef] = useState(['']);
  const [isSaving, setSaving] = useState(false);

  useEffect(
    () => {
      setName(data.name);
      setAuthorityRef(params.authorityRef);
      setAuthoritiesRef(params.authoritiesRef);
    },
    [id, data.name, params.authorityRef, params.authoritiesRef]
  );

  const handleChangeName = useCallback(name => setName(name), []);
  const handleChangeAuthority = useCallback(authorityRef => setAuthorityRef(authorityRef), []);
  const handleChangeAuthorities = useCallback(authoritiesRef => setAuthoritiesRef(authoritiesRef), []);
  const handleSave = useCallback(
    () => {
      setSaving(true);
      onSave({ name, authorityRef, authoritiesRef });
    },
    [name, authorityRef, authoritiesRef]
  );

  const isInvalid = !(isFilledLabelWeak(name) && (authorityRef || authoritiesRef.length > 0));

  return (
    <div className="journal-journal-preset-editor">
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
            disabled={!isAdmin}
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
