import React from 'react';
import omit from 'lodash/omit';
import get from 'lodash/get';

import SelectJournal from '../../../../../common/form/SelectJournal';

import BaseEditorView from '../BaseEditor/BaseEditorView';
import { getCellValue } from '../../util';

class JournalEditorView extends BaseEditorView {
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
    const { extraProps } = this.props;
    const props = omit(this.props, ['extraProps', 'onUpdate']);

    const { value } = extraProps;
    const multiple = this.isMultiple;
    const journalId = get(extraProps, 'config.journalId', '');

    return (
      <SelectJournal
        {...props}
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

export default JournalEditorView;
