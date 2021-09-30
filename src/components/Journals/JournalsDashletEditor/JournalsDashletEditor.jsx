import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isUndefined from 'lodash/isUndefined';
import isFunction from 'lodash/isFunction';

import { Caption, Checkbox, Field, Input, Select } from '../../common/form';
import { Btn } from '../../common/btns';
import SelectJournal from '../../common/form/SelectJournal';
import {
  checkConfig,
  getDashletEditorData,
  saveDashlet,
  setDashletConfig,
  setDashletConfigByParams,
  setEditorMode,
  setLoading,
  setOnlyLinked,
  setSettingItem
} from '../../../actions/journals';
import { selectDashletConfig, selectDashletConfigJournalId, selectNewVersionDashletConfig } from '../../../selectors/journals';
import DashboardService from '../../../services/dashboard';
import { getSelectedValue, t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { JOURNAL_DASHLET_CONFIG_VERSION, JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';

import './JournalsDashletEditor.scss';

const mapStateToProps = (state, ownProps) => {
  const newState = state.journals[ownProps.stateId] || {};

  return {
    journalSettings: newState.journalSettings,
    generalConfig: selectDashletConfig(state, ownProps.stateId),
    config: selectNewVersionDashletConfig(state, ownProps.stateId),
    configJournalId: selectDashletConfigJournalId(state, ownProps.stateId),
    initConfig: newState.initConfig,
    editorMode: newState.editorMode,
    resultDashboard: get(state, ['dashboard', DashboardService.key, 'requestResult'], {}),
    isNotExistsJournal: !newState.isExistJournal
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const w = wrapArgs(ownProps.stateId);

  return {
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    getDashletEditorData: config => dispatch(getDashletEditorData(w(config))),
    setDashletConfigByParams: (id, config) => dispatch(setDashletConfigByParams(w({ id, config, recordRef: ownProps.recordRef }))),
    setSettingItem: id => dispatch(setSettingItem(w(id))),
    setOnlyLinked: onlyLinked => dispatch(setOnlyLinked(w(onlyLinked))),
    setDashletConfig: config => dispatch(setDashletConfig(w(config))),
    saveDashlet: (config, id) => dispatch(saveDashlet(w({ config, id }))),
    checkConfig: config => dispatch(checkConfig(w(config))),
    setLoading: isLoading => dispatch(setLoading(w(isLoading)))
  };
};

const Labels = {
  SETTING_TITLE: 'journals.action.edit-dashlet',
  CUSTOM_FIELD: 'journals.action.custom-journal',
  NAME_FIELD: 'journals.name',
  SETTING_FIELD: 'journals.settings',
  SETTING_FIELD_PLACEHOLDER: 'journals.default',
  CUSTOM_MODE_FIELD: 'journals.action.custom-journal',
  ONLY_LINKED_FIELD: 'journals.action.only-linked',
  RESET_BTN: 'journals.action.reset-settings',
  CANCEL_BTN: 'journals.action.cancel',
  SAVE_BTN: 'journals.action.save'
};

class JournalsDashletEditor extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    recordRef: PropTypes.string,
    className: PropTypes.string,
    measurer: PropTypes.object,
    config: PropTypes.object,
    generalConfig: PropTypes.object,
    journalSettings: PropTypes.array,
    onSave: PropTypes.func
  };

  #defaultState = Object.freeze({
    selectedJournals: [],
    customJournal: '',
    isCustomJournalMode: false
  });

  state = { ...this.#defaultState };

  componentDidMount() {
    const { config, getDashletEditorData } = this.props;

    if (!isEmpty(config)) {
      if (isEmpty(this.state.selectedJournals) && !isEmpty(config.journalsListIds)) {
        this.setState({ selectedJournals: config.journalsListIds });
      }

      this.setState({ isCustomJournalMode: config.customJournalMode });

      if (config.customJournalMode && config.customJournal) {
        this.setState({ customJournal: config.customJournal });
      }
    }

    getDashletEditorData(config);
  }

  componentDidUpdate(prevProps, prevState) {
    const prevConfig = prevProps.config || {};
    const prevResultDashboard = prevProps.resultDashboard || {};
    const {
      config = {},
      id,
      editorMode,
      resultDashboard = {},
      onSave,
      getDashletEditorData,
      setDashletConfigByParams,
      setEditorMode
    } = this.props;

    if (config && prevConfig.journalId !== config.journalId) {
      getDashletEditorData(config);
    }

    if (editorMode && isFunction(onSave) && prevResultDashboard.status !== resultDashboard.status && resultDashboard.status) {
      setDashletConfigByParams(id, config);
      setEditorMode(false);
      this.setState({ ...this.#defaultState });
    }

    if (!isEmpty(config)) {
      if (!isEqual(prevConfig.journalsListIds, config.journalsListIds) && !isEmpty(config.journalsListIds)) {
        this.setState({ selectedJournals: config.journalsListIds });
      }

      if (
        config.customJournalMode &&
        isEqual(this.state.customJournal, prevState.customJournal) &&
        !isEqual(config.customJournal, this.state.customJournal)
      ) {
        this.setState({ customJournal: config.customJournal });
      }

      if (prevConfig.customJournalMode !== config.customJournalMode) {
        this.setState({ isCustomJournalMode: config.customJournalMode });
      }

      if (!prevConfig.editorMode && config.editorMode && config.customJournalMode && config.customJournal) {
        this.setState({ customJournal: config.customJournal });
      }
    }
  }

  get isDisabled() {
    const { isCustomJournalMode, customJournal, selectedJournals } = this.state;

    if (isCustomJournalMode && !customJournal) {
      return true;
    }

    if (!isCustomJournalMode && isEmpty(selectedJournals)) {
      return true;
    }

    return false;
  }

  handleCancel = () => {
    const { config, setEditorMode } = this.props;

    config && setEditorMode(false);
  };

  handleSave = () => {
    const { config, id, recordRef, onSave, saveDashlet, setDashletConfig, checkConfig, setEditorMode } = this.props;
    const { selectedJournals, isCustomJournalMode, customJournal } = this.state;
    const generalConfig = this.props.generalConfig || {};
    const journalId = get(selectedJournals, '0', '');
    let newConfig = omit(config, ['journalsListId', 'journalType']);

    if (recordRef) {
      if (!isUndefined(generalConfig.onlyLinked) && isUndefined(newConfig.onlyLinked)) {
        newConfig.onlyLinked = generalConfig.onlyLinked;
      } else {
        newConfig.onlyLinked = isUndefined(newConfig.onlyLinked) || newConfig.onlyLinked;
      }
    }

    if (isUndefined(newConfig.customJournalMode)) {
      newConfig.customJournalMode = false;
    }

    newConfig.journalsListIds = selectedJournals;
    newConfig.journalId = journalId.substr(journalId.indexOf('@') + 1);
    newConfig.customJournalMode = isCustomJournalMode;
    newConfig.customJournal = customJournal;

    if (isEqual(config, newConfig)) {
      setEditorMode(false);
      return;
    }

    newConfig = {
      ...generalConfig,
      version: JOURNAL_DASHLET_CONFIG_VERSION,
      [JOURNAL_DASHLET_CONFIG_VERSION]: newConfig
    };

    if (isFunction(onSave)) {
      onSave(id, { config: newConfig });
    } else if (isFunction(saveDashlet)) {
      saveDashlet(newConfig, id);
    }

    setDashletConfig(newConfig);
    checkConfig(newConfig);
  };

  handleClear = () => {
    const { config, initConfig, setDashletConfig } = this.props;

    setDashletConfig(initConfig);
    this.setState({
      selectedJournals: config.journalsListIds,
      customJournal: config.customJournal,
      isCustomJournalMode: config.customJournalMode
    });
  };

  setSettingItem = item => {
    this.props.setSettingItem(item[JOURNAL_SETTING_ID_FIELD]);
  };

  setOnlyLinked = ({ checked }) => {
    this.props.setOnlyLinked(checked);
  };

  setCustomJournal = ({ target: { value = '' } }) => {
    this.setState({ customJournal: value });
  };

  setCustomJournalMode = ({ checked }) => {
    this.setState({
      customJournal: '',
      isCustomJournalMode: checked,
      selectedJournals: []
    });
  };

  setSelectedJournals = (selectedJournals = []) => {
    this.setState({ selectedJournals });
  };

  render() {
    const { className, measurer, recordRef, journalSettings, configJournalId, forwardRef } = this.props;
    const { customJournal, isCustomJournalMode } = this.state;
    const config = this.props.config || {};
    const isSmall = measurer && measurer.width && (measurer.xxs || measurer.xxxs);

    return (
      <div className={classNames('ecos-journal-dashlet-editor', className)} ref={forwardRef}>
        <div className={classNames('ecos-journal-dashlet-editor__body', { 'ecos-journal-dashlet-editor__body_small': isSmall })}>
          <Caption middle className="ecos-journal-dashlet-editor__caption">
            {t(Labels.SETTING_TITLE)}
          </Caption>

          {isCustomJournalMode ? (
            <Field label={t(Labels.CUSTOM_FIELD)} isSmall={isSmall} isRequired>
              <Input value={customJournal} onChange={this.setCustomJournal} type="text" />
            </Field>
          ) : (
            <>
              <Field label={t(Labels.NAME_FIELD)} isSmall={isSmall} labelPosition="top">
                <SelectJournal
                  journalId={'ecos-journals'}
                  defaultValue={this.state.selectedJournals}
                  multiple
                  hideCreateButton
                  isSelectedValueAsText
                  onChange={this.setSelectedJournals}
                  onCancel={() => this.setSelectedJournals()}
                />
              </Field>

              <Field label={t(Labels.SETTING_FIELD)} isSmall={isSmall}>
                <Select
                  className="ecos-journal-dashlet-editor__select"
                  placeholder={t(Labels.SETTING_FIELD_PLACEHOLDER)}
                  options={journalSettings}
                  getOptionLabel={option => option[JOURNAL_SETTING_DATA_FIELD].title}
                  getOptionValue={option => option[JOURNAL_SETTING_ID_FIELD]}
                  onChange={this.setSettingItem}
                  value={getSelectedValue(journalSettings, JOURNAL_SETTING_ID_FIELD, config.journalSettingId)}
                />
              </Field>
            </>
          )}
          <Field label={t(Labels.CUSTOM_MODE_FIELD)} isSmall={isSmall}>
            <Checkbox checked={isUndefined(isCustomJournalMode) ? false : isCustomJournalMode} onChange={this.setCustomJournalMode} />
          </Field>
          {!!recordRef && (
            <Field label={t(Labels.ONLY_LINKED_FIELD)} isSmall={isSmall}>
              <Checkbox checked={isUndefined(config.onlyLinked) ? true : config.onlyLinked} onChange={this.setOnlyLinked} />
            </Field>
          )}
        </div>

        <div className={classNames('ecos-journal-dashlet-editor__actions', { 'ecos-journal-dashlet-editor__actions_small': isSmall })}>
          <Btn onClick={this.handleClear}>{t(Labels.RESET_BTN)}</Btn>
          <div className="ecos-journal-dashlet-editor__actions-diver" />
          {configJournalId && <Btn onClick={this.handleCancel}>{t(Labels.CANCEL_BTN)}</Btn>}
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.handleSave} disabled={this.isDisabled}>
            {t(Labels.SAVE_BTN)}
          </Btn>
        </div>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletEditor);
