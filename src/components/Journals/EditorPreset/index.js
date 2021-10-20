import React, { useCallback, useEffect, useState } from 'react';

import { Btn } from '../../common/btns';
import { EcosModal } from '../../common';
import { t } from '../../../helpers/export/util';
import { Input } from '../../common/form';

const EditorPreset = props => {
  const { onClose } = props;
  const [name, setName] = useState('');

  useEffect(() => {
    setName(props.data.name);
  }, [props.data]);

  const handleChangeName = useCallback(e => setName(e.target.value), []);

  return (
    <EcosModal title={t('journals.action.dialog-msg')} isOpen hideModal={onClose} className={'journal__dialog ecos-modal_width-sm'}>
      <Input type="text" value={name} onChange={handleChangeName} />

      <div className="journal__dialog-buttons">
        <Btn onClick={onClose}>{t('journals.action.cancel')}</Btn>
        <Btn onClick={onClose} className={'ecos-btn_blue'}>
          {t('journals.action.save')}
        </Btn>
      </div>
    </EcosModal>
  );
};

export default EditorPreset;
