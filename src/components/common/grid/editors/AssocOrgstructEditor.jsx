import React from 'react';

import BaseEditor from './BaseEditor';
import { SelectOrgstruct } from '../../form';
import { AUTHORITY_TYPE_GROUP, AUTHORITY_TYPE_USER } from '../../form/SelectOrgstruct/constants';
import {
  COLUMN_DATA_TYPE_AUTHORITY,
  COLUMN_DATA_TYPE_AUTHORITY_GROUP,
  COLUMN_DATA_TYPE_PERSON
} from '../../../Records/predicates/predicates';

export default class AssocOrgstructEditor extends BaseEditor {
  onChange = newValue => {
    const oldValue = this.getValue() || {};

    this.props.onUpdate(
      this.setValue({
        assoc: newValue.id || oldValue.assoc,
        disp: newValue.label || newValue.disp || oldValue.disp
      })
    );
  };

  get allowedAuthorityTypes() {
    return [
      [AUTHORITY_TYPE_GROUP, [COLUMN_DATA_TYPE_AUTHORITY_GROUP, COLUMN_DATA_TYPE_AUTHORITY]],
      [AUTHORITY_TYPE_USER, [COLUMN_DATA_TYPE_PERSON, COLUMN_DATA_TYPE_AUTHORITY]]
    ]
      .filter(([, dataType]) => dataType.includes(this.props.column.type))
      .map(([autoType]) => autoType);
  }

  render() {
    const { value, dateFormat, onUpdate, column, ...rest } = this.props;

    return (
      <SelectOrgstruct
        {...rest}
        isCompact
        getFullData
        inputViewClass="select-orgstruct__input-view_сompact-extra"
        defaultValue={(value || {}).assoc}
        allowedAuthorityTypes={this.allowedAuthorityTypes}
        onChange={this.onChange}
        onCancelSelect={rest.onBlur}
      />
    );
  }
}
