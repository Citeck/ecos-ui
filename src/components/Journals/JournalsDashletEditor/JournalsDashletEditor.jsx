import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isBoolean from 'lodash/isBoolean';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import isUndefined from 'lodash/isUndefined';
import omit from 'lodash/omit';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import JournalsService from '../../../components/Journals/service';
import { LinkedAttributesSelect } from '../../LinkedAttributesSelect';
import Records from '../../Records';
import { Btn } from '../../common/btns';
import { Caption, Checkbox, Field, Input, Select, SelectJournal } from '../../common/form';
import { JOURNAL_DASHLET_CONFIG_VERSION } from '../constants';

import GoToButton from './GoToButton';

import {
  checkConfig,
  getDashletEditorData,
  saveDashlet,
  setDashletConfig,
  setDashletConfigByParams,
  setEditorMode,
  setLoading
} from '@/actions/journals';
import { SystemJournals, SourcesId } from '@/constants';
import { SearchInWorkspacePolicy, SearchWorkspacePolicyOptions } from '@/forms/components/custom/selectJournal/constants';
import { wrapArgs } from '@/helpers/redux';
import { getWorkspaceId } from '@/helpers/urls';
import { getEnabledWorkspaces, getSelectedValue, t } from '@/helpers/util';
import { selectJournalDashletEditorProps } from '@/selectors/dashletJournals';
import DashboardService from '@/services/dashboard';

import './JournalsDashletEditor.scss';

const mapStateToProps = (state, ownProps) => {
  const ownState = selectJournalDashletEditorProps(state, ownProps.stateId);

  return {
    ...ownState,
    resultDashboard: get(state, ['dashboard', DashboardService.key, 'requestResult'], {})
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
  AGGREGATION_WORKSPACES: 'journals.aggregation-workspaces',
  SETTING_FIELD: 'journals.settings',
  SETTING_FIELD_PLACEHOLDER: 'journals.default',
  CUSTOM_MODE_FIELD: 'journals.action.custom-journal',
  HIDE_GO_TO_BUTTON: 'journals.toolbar.hide-goto-button',
  HIDE_CREATE_VARIANTS: 'journals.toolbar.hide-create-variants',
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
    isCustomJournalMode: false
  });

  _dataInit;

  constructor(props) {
    super(props);

    const currentWorkspaceRef = `${SourcesId.WORKSPACE}@${getWorkspaceId()}`;
    const defaultPolicy = SearchWorkspacePolicyOptions.find(item => item.value === SearchInWorkspacePolicy.CURRENT);

    this.state = {
      ...this.#defaultStateConfig,
      isOnlyLinkedJournals: get(props, 'config.onlyLinkedJournals') || {},
      attrsToLoad: get(props, 'config.attrsToLoad') || {},
      isHideCreateVariants: get(props, 'config.isHideCreateVariants') || false,
      isHideGoToButton: get(props, 'config.isHideGoToButton') || false,
      searchInWorkspacePolicy:
        (isObject(get(props, 'config.searchInWorkspacePolicy'))
          ? props.config.searchInWorkspacePolicy.value
          : get(props.config, 'searchInWorkspacePolicy')) || defaultPolicy.value,
      searchInAdditionalWorkspaces: get(props, 'config.searchInAdditionalWorkspaces') ||
        get(props, 'config.aggregateWorkspaces') || [currentWorkspaceRef]
    };
  }

  componentDidMount() {
    this._dataInit = false;
    const { config, getDashletEditorData } = this.props;

    getDashletEditorData(config);

    if (!isEmpty(config)) {
      this.setFirstStateConfig();
    }

    this.fetchTypeRef();
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

    if (
      editorMode &&
      isFunction(onSave) &&
      prevResultDashboard.status !== resultDashboard.status &&
      resultDashboard.status &&
      isObject(config)
    ) {
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

  getDispJournalId(journalId) {
    return journalId?.includes('@') ? journalId.split('@')[1] : journalId;
  }

  get isDisabled() {
    const { isCustomJournalMode, isOnlyLinkedJournals, attrsToLoad, customJournal, selectedJournals } = this.state;

    if (
      isOnlyLinkedJournals &&
      attrsToLoad &&
      isObject(attrsToLoad) &&
      isObject(isOnlyLinkedJournals) &&
      !Object.entries(isOnlyLinkedJournals).every(
        ([journalId, flag]) => !flag || (!!flag && get(attrsToLoad, [journalId]) && attrsToLoad[journalId].length > 0)
      )
    ) {
      return true;
    }

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

    if (!isEmpty(config) && !this._dataInit) {
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

      if (!isUndefined(config.onlyLinked) && !isEqual(config.onlyLinked, this.state.isOnlyLinkedJournals)) {
        newState.isOnlyLinkedJournals = config.onlyLinkedJournals;
      }

      if (!isUndefined(config.goToButtonName) && !isEqual(config.goToButtonName, this.state.goToButtonName)) {
        newState.goToButtonName = config.goToButtonName;
      }
    }

    if (!isEmpty(newState)) {
      this._dataInit = true;
      this.setState(newState);
    }
  }

  fetchTypeRef = () => {
    const { recordRef } = this.props;

    if (!recordRef) {
      return;
    }

    Records.get(recordRef)
      .load('_type?id')
      .then(typeRef => {
        this.setState({ typeRef });
      });
  };

  handleCancel = () => {
    const { config, setEditorMode } = this.props;

    config && setEditorMode(false);
  };

  handleSave = () => {
    const { config, id, recordRef, onSave, saveDashlet, setDashletConfig, checkConfig, setEditorMode } = this.props;
    const {
      attrsToLoad,
      selectedJournals,
      isCustomJournalMode,
      customJournal,
      journalSettingId,
      isOnlyLinkedJournals,
      searchInWorkspacePolicy,
      searchInAdditionalWorkspaces,
      goToButtonName,
      isHideCreateVariants,
      isHideGoToButton
    } = this.state;
    const generalConfig = this.props.generalConfig || {};
    const journalId = get(selectedJournals, '0', '');

    let newConfig = omit(config, ['journalsListId', 'journalType']);

    if (recordRef) {
      newConfig.onlyLinkedJournals = isOnlyLinkedJournals;
      newConfig.attrsToLoad = attrsToLoad;
    }

    if (getEnabledWorkspaces()) {
      newConfig.searchInWorkspacePolicy = searchInWorkspacePolicy;
      newConfig.aggregateWorkspaces = JournalsService.getWorkspaceByPolicy(searchInWorkspacePolicy.value, searchInAdditionalWorkspaces);
    }

    newConfig.isHideCreateVariants = isHideCreateVariants;
    newConfig.isHideGoToButton = isHideGoToButton;
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
      setDashletConfig(newConfig);
      checkConfig(newConfig);
    }
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

  onChangeLinkedSettings = (settings, id) => {
    const newSettings = cloneDeep(settings);
    const { isOnlyLinked: newIsOnlyLinked, attrsToLoad: newAttrsToLoad } = newSettings || {};
    const { attrsToLoad, isOnlyLinkedJournals } = this.state;

    const journalId = this.getDispJournalId(id);

    if (journalId) {
      if (!newAttrsToLoad && !get(attrsToLoad, [journalId]) && newIsOnlyLinked) {
        newSettings.attrsToLoad = { ...attrsToLoad, [journalId]: [] };
      }

      if (newAttrsToLoad) {
        newSettings.attrsToLoad = { ...attrsToLoad, [journalId]: newAttrsToLoad };
      }
    }

    if (isBoolean(newIsOnlyLinked) && journalId) {
      newSettings.isOnlyLinkedJournals = { ...isOnlyLinkedJournals, [journalId]: newIsOnlyLinked };
      delete newSettings.isOnlyLinked;
    }

    this.setState(newSettings);
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

  toggleHideGoToButton = () => {
    this.setState(state => ({ isHideGoToButton: !state.isHideGoToButton }));
  };

  toggleIsHideCreateVariants = () => {
    this.setState(state => ({ isHideCreateVariants: !state.isHideCreateVariants }));
  };

  setSelectedJournals = (selectedJournals = []) => {
    this.setState({ selectedJournals });
  };

  setSelectedWorkspacePolicy = policy => {
    this.setState({ searchInWorkspacePolicy: policy.value });
  };

  setSelectedAdditionsWorkspaces = (searchInAdditionalWorkspaces = []) => {
    this.setState({ searchInAdditionalWorkspaces });
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
    const {
      attrsToLoad,
      typeRef,
      customJournal,
      selectedJournals,
      journalSettingId,
      isCustomJournalMode,
      isHideGoToButton,
      isHideCreateVariants,
      isOnlyLinkedJournals,
      searchInWorkspacePolicy,
      searchInAdditionalWorkspaces,
      goToButtonName
    } = this.state;

    const workspacePolicy = SearchWorkspacePolicyOptions.find(({ value }) => value === searchInWorkspacePolicy);

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
                  journalId={SystemJournals.JOURNALS}
                  defaultValue={selectedJournals}
                  multiple
                  hideCreateButton
                  isSelectedValueAsText
                  onChange={this.setSelectedJournals}
                />
              </Field>

              {getEnabledWorkspaces() && (
                <>
                  <Field label={t('workspace-polices.title')} isSmall={this.isSmall} labelPosition="top">
                    <Select
                      onChange={this.setSelectedWorkspacePolicy}
                      value={workspacePolicy ? { value: workspacePolicy.value, label: t(workspacePolicy.label) } : null}
                      options={SearchWorkspacePolicyOptions.map(item => ({
                        value: item.value,
                        label: t(item.label)
                      }))}
                    />
                  </Field>
                  {[SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL, SearchInWorkspacePolicy.ONLY_ADDITIONAL].includes(
                    searchInWorkspacePolicy.value
                  ) && (
                    <Field label={t('workspace-polices.additional-title')} isSmall={this.isSmall} labelPosition="top">
                      <SelectJournal
                        journalId={SystemJournals.WORKSPACES}
                        defaultValue={searchInAdditionalWorkspaces}
                        multiple
                        hideCreateButton
                        isSelectedValueAsText
                        onChange={this.setSelectedAdditionsWorkspaces}
                        isCompact
                        isRequired
                      />
                    </Field>
                  )}
                </>
              )}

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
          <Field label={t(Labels.HIDE_GO_TO_BUTTON)} isSmall={this.isSmall}>
            <Checkbox checked={isHideGoToButton} onClick={this.toggleHideGoToButton} />
          </Field>
          <Field label={t(Labels.HIDE_CREATE_VARIANTS)} isSmall={this.isSmall}>
            <Checkbox checked={isHideCreateVariants} onClick={this.toggleIsHideCreateVariants} />
          </Field>

          <GoToButton isSmall={this.isSmall} value={goToButtonName} onChange={this.handleChangeGoToButtonName} />

          {!!recordRef &&
            !!selectedJournals?.length &&
            selectedJournals.map(journalId => (
              <LinkedAttributesSelect
                key={journalId}
                typeRef={typeRef}
                journalId={journalId}
                onChange={settings => this.onChangeLinkedSettings(settings, journalId)}
                isOnlyLinked={get(isOnlyLinkedJournals, [this.getDispJournalId(journalId)], false)}
                attrsToLoad={get(attrsToLoad, [this.getDispJournalId(journalId)], [])}
              />
            ))}
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

export default connect(mapStateToProps, mapDispatchToProps)(JournalsDashletEditor);
