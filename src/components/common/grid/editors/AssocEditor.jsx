import React from 'react';
import SelectJournal from '../../../common/form/SelectJournal';
import BaseEditor from './BaseEditor';

export default class DateEditor extends BaseEditor {
  onChange = value => {
    this._value = value;

    this.props.onUpdate(this.getValue());
  };

  render() {
    const { value, dateFormat, onUpdate, column, ...rest } = this.props;

    return (
      <SelectJournal
        {...rest}
        autoFocus
        inputViewClass={'select-journal__input-view_extra-compact'}
        isCompact={true}
        journalId={column.editorKey}
        defaultValue={value}
        onChange={this.onChange}
        onCancel={rest.onBlur}
      />
    );
  }
}
