import React from 'react';
import set from 'lodash/set';
import get from 'lodash/get';

import { t } from '../../../helpers/export/util';
import { SystemJournals } from '../../../constants';
import { MenuSettings } from '../../../constants/menu';
import { SelectJournal } from '../../common/form';
import { Labels } from '../utils';
import { Field } from '../Field';
import Base from './Base';

export default class StartWorkflow extends Base {
  type = MenuSettings.ItemTypes.START_WORKFLOW;
  state = {
    ...super.state,
    processDef: '',
    error: false
  };

  componentDidMount() {
    const { item } = this.props;
    const processDef = get(item, 'config.processDef');

    super.componentDidMount();
    this.setState({ processDef });
  }

  isInvalidForm() {
    const { error, processDef } = this.state;

    return Boolean(error) || !Boolean(processDef);
  }

  handleApply() {
    super.handleApply();

    const { onSave } = this.props;
    const { processDef, label } = this.state;

    set(this.data, 'config.processDef', processDef);
    set(this.data, 'label', label);

    onSave(this.data);
  }

  setProcess = (processDef, data) => {
    this.setState({ processDef, label: get(data, '[0].disp') });
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
    const { processDef } = this.state;

    return (
      <this.wrapperModal>
        {this.renderErrorMessage()}
        <Field label={t(Labels.FIELD_PROCESS)} required>
          <SelectJournal defaultValue={processDef} onChange={this.setProcess} journalId={SystemJournals.PROCESS} isSelectedValueAsText />
        </Field>
      </this.wrapperModal>
    );
  }
}
