import React from 'react';

import Records from '../../../../../Records/Records';
import SelectJournal from '../../../../../common/form/SelectJournal';
import EditorScope from '../../EditorScope';
import BaseEditor from '../BaseEditor';

export default class JournalEditor extends BaseEditor {
  static TYPE = 'journal';

  getControl(config, scope) {
    const journalId = config.journalId;

    return ({ value, onUpdate, onCancel, multiple }) => (
      <SelectJournal
        multiple={multiple}
        autoFocus={scope === EditorScope.CELL}
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
