import React, { useState } from 'react';

import { Btn } from '../../../../../components/common/btns';
import { EcosModal, Icon } from '../../../../../components/common';
import { Textarea } from '../../../../../components/common/form';
import { t } from '../../../../../helpers/util';
import Records from '../../../../../components/Records';

export const NoteComponent = ({ row }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [note, setNote] = useState(row.note);

  const handleSaveNote = () => {
    setIsLoading(true);

    const rowRecord = Records.get(row.id);

    rowRecord.att('note', note);
    row.note = note;

    rowRecord.save().then(() => {
      setIsLoading(false);
      setIsOpen(false);
    });
  };

  return (
    <>
      {row.note && (
        <div className="bpmn-process__clickable-text" onClick={() => setIsOpen(true)}>
          {row.note}
        </div>
      )}
      {!row.note && <Icon className="icon-edit" onClick={() => setIsOpen(true)} />}
      <EcosModal title={t('bpmn-admin.incident.note')} isOpen={isOpen} hideModal={() => setIsOpen(false)} autoFocus>
        <Textarea value={note} onChange={e => setNote(e.target.value)} />
        <div className="bpmn-process__note-actions">
          <Btn className="ecos-btn_x-step_10" onClick={() => setIsOpen(false)}>
            {t('btn.cancel.label')}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" disabled={isLoading} loading={isLoading} onClick={handleSaveNote}>
            {t('btn.save.label')}
          </Btn>
        </div>
      </EcosModal>
    </>
  );
};
