import React from 'react';
import set from 'lodash/set';
import get from 'lodash/get';

import { t } from '../../../helpers/export/util';
import { SystemJournals } from '../../../constants';
import { MenuSettings } from '../../../constants/menu';
import { MLText, SelectJournal } from '../../common/form';
import { Labels } from '../utils';
import { Field } from '../Field';
import Base from './Base';

export default class StartWorkflow extends Base {
  type = MenuSettings.ItemTypes.START_WORKFLOW;
  state = {
    ...super.state,
    processDef: '',
    processLabel: '',
    error: false
  };

  componentDidMount() {
    const { item } = this.props;
    const processDef = get(item, 'config.processDef');
    const label = get(item, 'label');

    super.componentDidMount();
    this.setState({ processDef, label });
  }

  isInvalidForm() {
    const { error, processDef, processLabel } = this.state;

    return Boolean(error) || !Boolean(processDef) || (this.isInvalidLabel && !processLabel);
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { processDef, label, processLabel } = this.state;

    set(this.data, 'config.processDef', processDef);
    set(this.data, 'label', label || processLabel);

    onSave(this.data);
  }

  setProcess = (processDef, data) => {
    this.setState(() => {
      const id = get(data, '[0].id');
      const disp = get(data, '[0].disp');
      return { processDef, processLabel: id === disp ? '' : disp };
    });
  };

  setLabel = label => {
    this.setState({ label });
  };

  renderErrorMessage() {
    const { error } = this.state;

    if (!error) {
      return null;
    }

    return (
      <div className="alert alert-danger" role="alert">
        {t('error')}
      </div>
    );
  }

  render() {
    const { processDef, label, processLabel } = this.state;

    return (
      <this.wrapperModal>
        {this.renderErrorMessage()}
        <Field label={t(Labels.FIELD_PROCESS)} required>
          <SelectJournal defaultValue={processDef} onChange={this.setProcess} journalId={SystemJournals.PROCESS} isSelectedValueAsText />
        </Field>
        <Field label={t(Labels.FIELD_NAME_LABEL)} required={!processLabel}>
          <MLText onChange={this.setLabel} value={label} placeholder={processLabel ? `${t(Labels.DEFAULT)} ${processLabel}` : ''} />
        </Field>
      </this.wrapperModal>
    );
  }
}
