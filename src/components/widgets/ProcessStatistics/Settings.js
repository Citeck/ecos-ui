import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';

import { SystemJournals } from '../../../constants';
import { t } from '../../../helpers/util';
import { Caption, Checkbox, Field, Select, SelectJournal } from '../../common/form';
import { Btn } from '../../common/btns';
import { Labels } from './util';
import plugins from '../../../plugins';
import { EXTENDED_MODE, SIMPLIFIED_MODE } from './constants';

import './style.scss';

export default class Settings extends React.Component {
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
      selectedJournal: get(props, 'config.selectedJournal'),
      showHeatmapDefault: get(props, 'config.showHeatmapDefault'),
      showModelDefault: get(props, 'config.showModelDefault'),
      showJournalDefault: get(props, 'config.showJournalDefault'),
      showCountersDefault: get(props, 'config.showCountersDefault'),
      displayHeatmapToolbar: get(props, 'config.displayHeatmapToolbar'),
      formMode: get(props, 'config.formMode', EXTENDED_MODE)
    };
  }

  onCancel = () => this.props.onCancel();

  onSave = () => {
    this.props.onSave({ ...this.state });
  };

  onToggleFlag = keyFlag => this.setState({ [keyFlag]: !this.state[keyFlag] });

  renderFlags = sortedFlags => {
    return sortedFlags.map(key => (
      <Field key={key} label={t('process-statistics-widget.settings.field.' + key)} labelPosition="top">
        <Checkbox checked={this.state[key]} onClick={_ => this.onToggleFlag(key)} />
      </Field>
    ));
  };

  render() {
    const { selectedJournal, formMode } = this.state;

    const { HeatmapWrapper } = plugins;

    const propertiesOptions = [
      { value: EXTENDED_MODE, label: t(Labels.FORM_MODE_EXTENDED) },
      { value: SIMPLIFIED_MODE, label: t(Labels.FORM_MODE_SIMPLIFIED) }
    ];

    return (
      <div className="ecos-process-statistics-settings">
        <Caption middle className="ecos-process-statistics-settings__title">
          {t(Labels.SETTINGS_TITLE)}
        </Caption>
        <Field label={t(Labels.FORM_MODE_SELECT_LABEL)} labelPosition="top">
          <Select
            value={propertiesOptions.find(i => i.value === formMode)}
            options={propertiesOptions}
            onChange={({ value }) => {
              this.setState({ formMode: value });
            }}
          />
        </Field>

        <Field label={t(Labels.JOURNAL_FIELD)} labelPosition="top">
          <SelectJournal
            journalId={SystemJournals.JOURNALS}
            defaultValue={selectedJournal}
            viewOnly
            hideCreateButton
            onChange={selectedJournal => this.setState({ selectedJournal })}
          />
        </Field>
        {!!HeatmapWrapper && (
          <>
            <Caption small className="ecos-process-statistics-settings__title">
              {t(Labels.SETTINGS_DEFAULT_FLAGS)}
            </Caption>
            {this.renderFlags(['showJournalDefault', 'showModelDefault', 'showHeatmapDefault', 'showCountersDefault'])}

            <Caption small className="ecos-process-statistics-settings__title">
              {t(Labels.SETTINGS_READ_OUT)}
            </Caption>
            {this.renderFlags(['displayHeatmapToolbar'])}
          </>
        )}
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
