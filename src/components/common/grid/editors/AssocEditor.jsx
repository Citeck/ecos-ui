import React from 'react';
import SelectJournal from '../../../common/form/SelectJournal';
import BaseEditor from './BaseEditor';

export default class AssocEditor extends BaseEditor {
  onChange = (value, selected) => {
    const oldValue = this.getValue() || {};
    const newValue = selected[0] || {};

    this.props.onUpdate(
      this.setValue({
        assoc: newValue.id || oldValue.assoc,
        disp: newValue.disp || oldValue.disp
      })
    );
  };

  render() {
    const { value, dateFormat, onUpdate, column, ...rest } = this.props;

    return (
      <SelectJournal
        {...rest}
        autoFocus
        isCompact
        inputViewClass="select-journal__input-view_extra-compact"
        journalId={column.editorKey}
        defaultValue={(value || {}).assoc}
        onChange={this.onChange}
        onCancel={rest.onBlur}
      />
    );
  }
}
