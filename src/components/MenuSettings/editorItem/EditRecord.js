import React from 'react';
import set from 'lodash/set';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import { MenuSettings } from '../../../constants/menu';
import { Labels } from './../utils';
import { Field } from './../Field';
import Base from './Base';
import { Input, SelectJournal, Textarea } from '../../common/form';
import { SystemJournals } from '../../../constants';

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

  isNotValid() {
    const { recordRef, formRef } = this.state;

    return !recordRef || !formRef;
  }

  setRecordRef = event => {
    const recordRef = get(event, 'target.value', '');
    this.setState({ recordRef });
  };

  setFormRef = formRef => {
    this.setState({ formRef });
  };

  setAttributes = event => {
    const attributes = get(event, 'target.value', '');
    this.setState({ attributes });
  };

  render() {
    const { recordRef, formRef, attributes } = this.state;

    return (
      <this.wrapperModal>
        <Field label={t(Labels.FIELD_RECORD_REF)} required>
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
