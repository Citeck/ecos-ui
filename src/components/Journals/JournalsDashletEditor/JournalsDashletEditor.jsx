import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import isUndefined from 'lodash/isUndefined';
import isFunction from 'lodash/isFunction';

import { Caption, Checkbox, Field, Input, Select, MLText } from '../../common/form';
import { Btn } from '../../common/btns';
import SelectJournal from '../../common/form/SelectJournal';
import {
  checkConfig,
  getDashletEditorData,
  saveDashlet,
  setDashletConfig,
  setDashletConfigByParams,
  setEditorMode,
  setLoading
} from '../../../actions/journals';
import { selectDashletConfig, selectDashletConfigJournalId, selectNewVersionDashletConfig } from '../../../selectors/journals';
import DashboardService from '../../../services/dashboard';
import { getSelectedValue, t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { JOURNAL_DASHLET_CONFIG_VERSION } from '../constants';

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
  GO_TO_BUTTON_NAME_FIELD: 'journals.action.go-to-button-name',
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

  #defaultStateConfig = Object.freeze({
    customJournal: '',
    selectedJournals: [],
    journalSettingId: '',
    isCustomJournalMode: false,
    isOnlyLinked: true
  });

  #dataInit = false;

  state = { ...this.#defaultStateConfig };

  componentDidMount() {
    const { config, getDashletEditorData } = this.props;

    getDashletEditorData(config);

    if (!isEmpty(config)) {
      this.setFirstStateConfig();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
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
      this.setState({ ...this.#defaultStateConfig });
    }

    if (!isEqual(prevConfig, config)) {
      this.setFirstStateConfig();
    }
  }

  componentWillUnmount() {
    this.setState({ ...this.#defaultStateConfig });
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

  setFirstStateConfig() {
    const newState = {};
    const config = this.props.config;

    if (!isEmpty(config) && !this.#dataInit) {
      if (!isUndefined(config.journalsListIds) && !isEqual(config.journalsListIds, this.state.selectedJournals)) {
        newState.selectedJournals = config.journalsListIds;
      }

      if (!isUndefined(config.journalSettingId) && !isEqualWith(config.journalSettingId, this.state.journalSettingId, isEqual)) {
        newState.journalSettingId = config.journalSettingId;
      }

      if (!isUndefined(config.customJournal) && !isEqual(config.customJournal, this.state.customJournal)) {
        newState.customJournal = config.customJournal;
      }

      if (!isUndefined(config.customJournalMode) && !isEqual(config.customJournalMode, this.state.isCustomJournalMode)) {
        newState.isCustomJournalMode = config.customJournalMode;
      }

      if (!isUndefined(config.onlyLinked) && !isEqual(config.onlyLinked, this.state.isOnlyLinked)) {
        newState.isOnlyLinked = config.onlyLinked;
      }

      if (!isUndefined(config.goToButtonName) && !isEqual(config.goToButtonName, this.state.goToButtonName)) {
        newState.goToButtonName = config.goToButtonName;
      }
    }

    if (!isEmpty(newState)) {
      this.#dataInit = true;
      this.setState(newState);
    }
  }

  handleCancel = () => {
    const { config, setEditorMode } = this.props;

    config && setEditorMode(false);
  };

  handleSave = () => {
    const { config, id, recordRef, onSave, saveDashlet, setDashletConfig, checkConfig, setEditorMode } = this.props;
    const { selectedJournals, isCustomJournalMode, customJournal, journalSettingId, isOnlyLinked, goToButtonName } = this.state;
    const generalConfig = this.props.generalConfig || {};
    const journalId = get(selectedJournals, '0', '');
    let newConfig = omit(config, ['journalsListId', 'journalType']);

    if (recordRef) {
      newConfig.onlyLinked = isOnlyLinked;
    }

    newConfig.journalsListIds = selectedJournals;
    newConfig.journalSettingId = journalSettingId;
    newConfig.journalId = journalId.substr(journalId.indexOf('@') + 1);
    newConfig.customJournalMode = isCustomJournalMode;
    newConfig.customJournal = customJournal;
    newConfig.goToButtonName = goToButtonName;

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
    this.setState({ journalSettingId: item.id });
  };

  setOnlyLinked = isOnlyLinked => {
    this.setState({ isOnlyLinked });
  };

  setCustomJournal = e => {
    this.setState({ customJournal: get(e, 'target.value', '') });
  };

  setCustomJournalMode = isCustomJournalMode => {
    this.setState({
      customJournal: '',
      isCustomJournalMode,
      selectedJournals: []
    });
  };

  setSelectedJournals = (selectedJournals = []) => {
    this.setState({ selectedJournals });
  };

  handleChangeGoToButtonName = goToButtonName => {
    this.setState({ goToButtonName });
  };

  get isSmall() {
    const { measurer } = this.props;

    return measurer && !!measurer.width && (measurer.xxs || measurer.xxxs);
  }

  render() {
    const { className, recordRef, journalSettings, configJournalId, forwardRef } = this.props;
    const { customJournal, selectedJournals, journalSettingId, isCustomJournalMode, isOnlyLinked, goToButtonName } = this.state;

    return (
      <div className={classNames('ecos-journal-dashlet-editor', className)} ref={forwardRef}>
        <div className={classNames('ecos-journal-dashlet-editor__body', { 'ecos-journal-dashlet-editor__body_small': this.isSmall })}>
          <Caption middle className="ecos-journal-dashlet-editor__caption">
            {t(Labels.SETTING_TITLE)}
          </Caption>

          {isCustomJournalMode ? (
            <Field label={t(Labels.CUSTOM_FIELD)} isSmall={this.isSmall} isRequired>
              <Input value={customJournal} onChange={this.setCustomJournal} type="text" />
            </Field>
          ) : (
            <>
              <Field label={t(Labels.NAME_FIELD)} isSmall={this.isSmall} labelPosition="top">
                <SelectJournal
                  journalId={'ecos-journals'}
                  defaultValue={selectedJournals}
                  multiple
                  hideCreateButton
                  isSelectedValueAsText
                  onChange={this.setSelectedJournals}
                  onCancel={() => this.setSelectedJournals()}
                />
              </Field>

              <Field label={t(Labels.SETTING_FIELD)} isSmall={this.isSmall}>
                <Select
                  className="ecos-journal-dashlet-editor__select"
                  placeholder={t(Labels.SETTING_FIELD_PLACEHOLDER)}
                  options={journalSettings}
                  getOptionLabel={option => option.displayName}
                  getOptionValue={option => option.id}
                  onChange={this.setSettingItem}
                  value={getSelectedValue(journalSettings, 'id', journalSettingId)}
                />
              </Field>
            </>
          )}
          <Field label={t(Labels.CUSTOM_MODE_FIELD)} isSmall={this.isSmall}>
            <Checkbox checked={isCustomJournalMode} onClick={this.setCustomJournalMode} />
          </Field>
          {!!recordRef && (
            <Field label={t(Labels.ONLY_LINKED_FIELD)} isSmall={this.isSmall}>
              <Checkbox checked={isOnlyLinked} onClick={this.setOnlyLinked} />
            </Field>
          )}

          <Field label={t(Labels.GO_TO_BUTTON_NAME_FIELD)} isSmall={this.isSmall}>
            <MLText value={goToButtonName} onChange={this.handleChangeGoToButtonName} />
          </Field>
        </div>

        <div className={classNames('ecos-journal-dashlet-editor__actions', { 'ecos-journal-dashlet-editor__actions_small': this.isSmall })}>
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
