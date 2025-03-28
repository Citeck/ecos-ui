import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { InfoText } from '../../../../components/common';
import { Btn } from '../../../../components/common/btns';
import { Caption, Dropdown, Field, MLText, SelectJournal } from '../../../../components/common/form';
import { SystemJournals } from '../../../../constants';
import { t } from '../../../../helpers/export/util';
import { getDOMElementMeasurer } from '../../../../helpers/util';
import Labels, { ERROR_TYPES } from '../../labels';

import './settings-style.scss';

class Settings extends Component {
  _ref = null;

  constructor(props) {
    super(props);

    this.state = {
      title: get(props, 'config.title', ''),
      typeId: get(props, 'config.typeId', ''),
      error: null,
      isLoading: false
    };
  }

  get isSmall() {
    const measurer = getDOMElementMeasurer(this._ref);

    return measurer && !!measurer.width && (measurer.xs || measurer.xxs || measurer.xxxs);
  }

  setEditorRef = ref => {
    if (ref) {
      this._ref = ref;
    }
  };

  handleChangeTypeId = newTypeId => {
    const { typeId } = this.state;

    if (typeId !== newTypeId) {
      this.setState({ typeId: newTypeId });
    }
  };

  setError = error => {
    if (ERROR_TYPES[error] || !error) {
      this.setState({ error });
    }
  };

  handleSave = () => {
    const { typeId, title } = this.state;
    const { onSave, config } = this.props;

    const stateOptions = this.state[typeId] || {};
    const configOptions = config[typeId] || {};

    isFunction(onSave) &&
      onSave({
        title,
        typeId
      });
  };

  render() {
    const { title, typeId, isLoading, error } = this.state;
    const { onCancel } = this.props;

    return (
      <div className="ecos-charts-settings" ref={this.setEditorRef}>
        <Field label={t(Labels.Settings.JOURNAL_FIELD)} labelPosition="top" isSmall={this.isSmall}>
          <SelectJournal
            journalId={SystemJournals.TYPES}
            defaultValue={typeId}
            hideCreateButton
            isSelectedValueAsText
            onChange={this.handleChangeTypeId}
          />

          {error && <InfoText text={t(Labels.Errors[error])} className="ecos-charts-settings__validate-message" type="error" />}
        </Field>

        <div className="ecos-charts-settings__buttons">
          <Btn className="mr-3" onClick={onCancel}>
            {t(Labels.Settings.SETTINGS_BTN_CANCEL)}
          </Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleSave} loading={isLoading}>
            {t(Labels.Settings.SETTINGS_BTN_SAVE)}
          </Btn>
        </div>
      </div>
    );
  }
}

Settings.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default Settings;
