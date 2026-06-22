import { SystemJournals } from '@citeck/constants';
import { MenuSettings } from '@citeck/constants/menu';
import Records from '@citeck/records-core';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import set from 'lodash/set';
import React from 'react';

import { t } from '@/helpers/util';
import { Input, SelectJournal, Textarea } from '@/components/common/form';
import { Field } from '../Field';
import { Labels } from '../utils';

import Base from './Base';

class EditRecord extends Base {
  type = MenuSettings.ItemTypes.EDIT_RECORD;

  componentDidMount() {
    super.componentDidMount();
    const config = get(this.props, 'item.config') || {};
    this.setState({ ...config });
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { recordRef, formRef, attributes } = this.state;

    set(this.data, 'config.recordRef', recordRef);
    set(this.data, 'config.formRef', formRef);
    set(this.data, 'config.attributes', attributes);

    onSave(this.data);
  }

  isInvalidForm() {
    const { recordRef, formRef } = this.state;

    return !recordRef || !formRef;
  }

  setLabel = ref => {
    Records.get(ref)
      .load('.disp')
      .then(label => this && this.setState({ label }));
  };

  setRecordRef = event => {
    const recordRef = get(event, 'target.value', '');
    this.setState({ recordRef });
    debounce(this.setLabel, 600)(recordRef);
  };

  setFormRef = formRef => {
    this.setState({ formRef });
  };

  setAttributes = event => {
    const attributes = get(event, 'target.value', '');
    this.setState({ attributes });
  };

  render() {
    const { recordRef, formRef, attributes, label } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_RECORD_REF)} required description={`${t(Labels.FIELD_NAME_LABEL)}: ${label || '—'}`}>
          <Input value={recordRef} onChange={this.setRecordRef} />
        </Field>
        <Field label={t(Labels.FIELD_FORM_REF)} required>
          <SelectJournal defaultValue={formRef} onChange={this.setFormRef} journalId={SystemJournals.FORMS} />
        </Field>
        <Field label={t(Labels.FIELD_ATTRIBUTES)}>
          <Textarea value={attributes} onChange={this.setAttributes} />
        </Field>
      </this.wrapperModal>
    );
  }
}

export default EditRecord;
