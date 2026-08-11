import Records from '@citeck/records-core';
import React from 'react';

import SelectJournal from '@/components/common/form/SelectJournal';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

export default class JournalEditor extends BaseEditor {
  static TYPE = 'journal';

  getControl(config, scope) {
    const journalId = config.journalId;

    return ({ value, onUpdate, onCancel, multiple, recordRef }) => (
      <SelectJournal
        multiple={config.multiple === undefined ? multiple : config.multiple}
        autoFocus={scope === EditorScope.CELL}
        isCompact
        hideCreateButton
        inputViewClass="select-journal__input-view_extra-compact"
        journalId={journalId}
        // Only a cell editor gets the edited row here, and only there does the row's own workspace
        // define what may be selected. In a filter recordRef is the journal's meta record, whose
        // workspace says nothing about the rows being filtered — the browsed one is right there.
        recordRef={scope === EditorScope.CELL ? recordRef : undefined}
        defaultValue={value}
        onChange={onUpdate}
        onCancel={onCancel}
      />
    );
  }

  getDisplayName(value, config, scope, state) {
    return Records.get(value).load('?disp');
  }
}
