import React from 'react';
import omit from 'lodash/omit';

import SelectJournal from '../../../../../common/form/SelectJournal';

import BaseEditorControl from '../BaseEditor/BaseEditorControl';
import { getCellValue } from '../../util';

class JournalEditorControl extends BaseEditorControl {
  handleChange = (value, selected) => {
    const { onUpdate } = this.props;

    onUpdate(
      this.setValue(
        selected.map(item => ({
          value: item.id,
          disp: item.disp
        }))
      )
    );
  };

  render() {
    const { value, config } = this.props;
    const props = omit(this.props, ['extraProps', 'onUpdate']);

    const multiple = this.isMultiple;
    const journalId = config.journalId;

    return (
      <SelectJournal
        multiple={multiple}
        autoFocus
        isCompact
        inputViewClass="select-journal__input-view_extra-compact"
        journalId={journalId}
        defaultValue={getCellValue(value)}
        onChange={this.handleChange}
        onCancel={props.onBlur}
      />
    );
  }
}

export default JournalEditorControl;
