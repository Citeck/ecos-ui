import React from 'react';
import PropTypes from 'prop-types';

import { SystemJournals } from '../../../constants';
import { t } from '../../../helpers/util';
import { Caption, Field, SelectJournal } from '../../common/form';
import { Btn } from '../../common/btns';
import { Labels } from './util';

import './style.scss';

export default class extends React.Component {
  static propTypes = {
    config: PropTypes.object,
    onSave: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    config: {},
    onSave: _ => _,
    onCancel: _ => _
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedJournal: props.config.selectedJournal
    };
  }

  onCancel = () => this.props.onCancel();

  onSave = () => {
    const { selectedJournal } = this.state;

    this.props.onSave({ selectedJournal });
  };

  onSelectJournal = selectedJournal => this.setState({ selectedJournal });

  render() {
    const { selectedJournal } = this.state;

    return (
      <div className="ecos-process-statistics-settings">
        <Caption middle className="ecos-process-statistics-settings__title">
          {t(Labels.SETTINGS_TITLE)}
        </Caption>
        <Field label={t(Labels.JOURNAL_FIELD)} labelPosition="top">
          <SelectJournal
            journalId={SystemJournals.JOURNALS}
            defaultValue={selectedJournal}
            hideCreateButton
            isSelectedValueAsText
            onChange={this.onSelectJournal}
          />
        </Field>
        <div className="ecos-process-statistics-settings__buttons">
          <Btn className="ecos-btn_hover_light-blue" onClick={this.onCancel}>
            {t(Labels.SETTINGS_BTN_CANCEL)}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.onSave}>
            {t(Labels.SETTINGS_BTN_SAVE)}
          </Btn>
        </div>
      </div>
    );
  }
}
