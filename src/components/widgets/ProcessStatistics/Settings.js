import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { SystemJournals } from '../../../constants';
import { t } from '../../../helpers/util';
import { Caption, Checkbox, Field, SelectJournal } from '../../common/form';
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
      selectedJournal: props.config.selectedJournal,
      showHeatmapDefault: get(props, 'config.showHeatmapDefault', true),
      showModelDefault: get(props, 'config.showModelDefault', true),
      showJournalDefault: get(props, 'config.showJournalDefault', false)
    };
  }

  onCancel = () => this.props.onCancel();

  onSave = () => {
    this.props.onSave({ ...this.state });
  };

  onToggleFlag = keyFlag => this.setState({ [keyFlag]: !this.state[keyFlag] });

  renderFlags = () => {
    const showKeys = Object.keys(this.state).filter(key => key.startsWith('show'));

    return showKeys.map(key => (
      <Field label={t('process-statistics-widget.settings.field.' + key)} labelPosition="top">
        <Checkbox checked={this.state[key]} onClick={_ => this.onToggleFlag(key)} />
      </Field>
    ));
  };

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
            // defaultValue={selectedJournal}
            viewOnly
            hideCreateButton
            onChange={selectedJournal => this.setState({ selectedJournal })}
          />
        </Field>
        <Caption small className="ecos-process-statistics-settings__title">
          {t(Labels.SETTINGS_DEFAULT_FLAGS)}
        </Caption>
        {this.renderFlags()}
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
