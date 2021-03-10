import BaseEditor from '../BaseEditor';
import Records from '../../../../../Records/Records';
import SelectJournal from '../../../../../common/form/SelectJournal';
import React from 'react';

export default class JournalEditor extends BaseEditor {
  static TYPE = 'journal';

  getControl(config, scope) {
    const journalId = config.journalId;

    return ({ value, onUpdate, onCancel, multiple }) => (
      <SelectJournal
        multiple={multiple}
        autoFocus
        isCompact
        inputViewClass="select-journal__input-view_extra-compact"
        journalId={journalId}
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
