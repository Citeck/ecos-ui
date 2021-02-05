import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';

import { Caption, Checkbox, Field, Input, Select } from '../../common/form';
import { Btn } from '../../common/btns';

import {
  getDashletEditorData,
  saveDashlet,
  setDashletConfig,
  setDashletConfigByParams,
  setEditorMode,
  setJournalsItem,
  setOnlyLinked,
  setCustomJournalMode,
  setCustomJournal,
  setSettingItem
} from '../../../actions/journals';

import { getSelectedValue, t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { JOURNAL_DASHLET_CONFIG_VERSION, JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';
import DashboardService from '../../../services/dashboard';
import SelectJournal from '../../common/form/SelectJournal';
import { selectDashletConfig, selectNewVersionDashletConfig } from '../../../selectors/journals';

import './JournalsDashletEditor.scss';

const mapStateToProps = (state, ownProps) => {
  const newState = state.journals[ownProps.stateId] || {};

  return {
    journalSettings: newState.journalSettings,
    generalConfig: selectDashletConfig(state, ownProps.stateId),
    config: selectNewVersionDashletConfig(state, ownProps.stateId),
    initConfig: newState.initConfig,
    editorMode: newState.editorMode,
    resultDashboard: get(state, ['dashboard', DashboardService.key, 'requestResult'], {})
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const w = wrapArgs(ownProps.stateId);

  return {
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    getDashletEditorData: config => dispatch(getDashletEditorData(w(config))),
    setDashletConfigByParams: (id, config) => dispatch(setDashletConfigByParams(w({ id, config }))),
    setJournalsItem: item => dispatch(setJournalsItem(w(item))),
    setSettingItem: id => dispatch(setSettingItem(w(id))),
    setOnlyLinked: onlyLinked => dispatch(setOnlyLinked(w(onlyLinked))),
    setCustomJournal: text => dispatch(setCustomJournal(w(text))),
    setCustomJournalMode: onlyLinked => dispatch(setCustomJournalMode(w(onlyLinked))),
    setDashletConfig: config => dispatch(setDashletConfig(w(config))),
    saveDashlet: (config, id) => dispatch(saveDashlet(w({ config, id })))
  };
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
    onSave: PropTypes.func,
    setJournalsItem: PropTypes.func
  };

  state = {
    selectedJournals: []
  };

  componentDidMount() {
    const { config, getDashletEditorData } = this.props;

    if (!isEmpty(config) && isEmpty(this.state.selectedJournals) && !isEmpty(config.journalsListIds)) {
      this.setState({ selectedJournals: config.journalsListIds });
    }

    getDashletEditorData(config);
  }

  componentDidUpdate(prevProps) {
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

    if (editorMode && onSave && prevResultDashboard.status !== resultDashboard.status && resultDashboard.status) {
      setDashletConfigByParams(id, config);
      setEditorMode(false);
    }

    if (!isEmpty(config) && !isEqual(prevConfig.journalsListIds, config.journalsListIds) && !isEmpty(config.journalsListIds)) {
      this.setState({ selectedJournals: config.journalsListIds });
    }
  }

  cancel = () => {
    const { config, setEditorMode } = this.props;

    config && setEditorMode(false);
  };

  save = () => {
    const { config, id, recordRef, onSave, saveDashlet, setDashletConfig, generalConfig } = this.props;
    const { selectedJournals } = this.state;
    const journalId = get(selectedJournals, '0', '');
    let newConfig = omit(config, ['journalsListId', 'journalType']);

    if (recordRef) {
      if (generalConfig.onlyLinked !== undefined && newConfig.onlyLinked === undefined) {
        newConfig.onlyLinked = generalConfig.onlyLinked;
      } else {
        newConfig.onlyLinked = newConfig.onlyLinked === undefined ? true : newConfig.onlyLinked;
      }
    }

    if (newConfig.customJournalMode === undefined) {
      newConfig.customJournalMode = false;
    }

    newConfig.journalsListIds = selectedJournals;
    newConfig.journalId = journalId.substr(journalId.indexOf('@') + 1);

    newConfig = {
      ...generalConfig,
      version: JOURNAL_DASHLET_CONFIG_VERSION,
      [JOURNAL_DASHLET_CONFIG_VERSION]: newConfig
    };

    if (onSave) {
      onSave(id, { config: newConfig });
    } else {
      saveDashlet(newConfig, id);
    }

    setDashletConfig(newConfig);
  };

  clear = () => {
    const { initConfig, setDashletConfig } = this.props;

    setDashletConfig(initConfig);
  };

  setSettingItem = item => {
    this.props.setSettingItem(item[JOURNAL_SETTING_ID_FIELD]);
  };

  setOnlyLinked = ({ checked }) => {
    this.props.setOnlyLinked(checked);
  };

  setCustomJournal = ({ target: { value = '' } }) => {
    this.props.setCustomJournal(value);
  };

  setCustomJournalMode = ({ checked }) => {
    this.props.setCustomJournalMode(checked);
  };

  setSelectedJournals = (selectedJournals = []) => {
    this.setState({ selectedJournals });
  };

  render() {
    const { className, measurer, recordRef, journalSettings } = this.props;
    const config = this.props.config || {};
    const isSmall = measurer && (measurer.xxs || measurer.xxxs);
    const checkSmall = isSmall => className => (isSmall ? className : '');
    const ifSmall = checkSmall(isSmall);

    return (
      <div className={classNames('ecos-journal-dashlet-editor', className)}>
        <div className={classNames('ecos-journal-dashlet-editor__body', ifSmall('ecos-journal-dashlet-editor__body_small'))}>
          <Caption middle className="ecos-journal-dashlet-editor__caption">
            {t('journals.action.edit-dashlet')}
          </Caption>

          {config.customJournalMode ? (
            <Field label={t('journals.action.custom-journal')} isSmall={isSmall}>
              <Input value={config.customJournal || ''} onChange={this.setCustomJournal} type="text" />
            </Field>
          ) : (
            <>
              <Field label={t('journals.name')} isSmall={isSmall}>
                <SelectJournal
                  journalId={'ecos-journals'}
                  defaultValue={this.state.selectedJournals}
                  multiple
                  hideCreateButton
                  onChange={this.setSelectedJournals}
                  onCancel={() => this.setSelectedJournals()}
                />
              </Field>

              <Field label={t('journals.settings')} isSmall={isSmall}>
                <Select
                  className={'ecos-journal-dashlet-editor__select'}
                  placeholder={t('journals.default')}
                  options={journalSettings}
                  getOptionLabel={option => option[JOURNAL_SETTING_DATA_FIELD].title}
                  getOptionValue={option => option[JOURNAL_SETTING_ID_FIELD]}
                  onChange={this.setSettingItem}
                  value={getSelectedValue(journalSettings, JOURNAL_SETTING_ID_FIELD, config.journalSettingId)}
                />
              </Field>
            </>
          )}
          <Field label={t('journals.action.custom-journal')} isSmall={isSmall}>
            <Checkbox
              checked={config.customJournalMode === undefined ? false : config.customJournalMode}
              onChange={this.setCustomJournalMode}
            />
          </Field>
          {recordRef ? (
            <Field label={t('journals.action.only-linked')} isSmall={isSmall}>
              <Checkbox checked={config.onlyLinked === undefined ? true : config.onlyLinked} onChange={this.setOnlyLinked} />
            </Field>
          ) : null}
        </div>

        <div className={classNames('ecos-journal-dashlet-editor__actions', { 'ecos-journal-dashlet-editor__actions_small': isSmall })}>
          <Btn onClick={this.clear}>{t('journals.action.reset-settings')}</Btn>
          <div className="ecos-journal-dashlet-editor__actions-diver" />
          <Btn onClick={this.cancel}>{t('journals.action.cancel')}</Btn>
          <Btn className="ecos-btn_blue ecos-btn_hover_light-blue" onClick={this.save}>
            {t('journals.action.save')}
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
