import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';
import get from 'lodash/get';

import { Caption, Checkbox, Field, Input, Select } from '../../common/form';
import { Btn } from '../../common/btns';

import {
  getDashletEditorData,
  saveDashlet,
  setDashletConfig,
  setDashletConfigByParams,
  setEditorMode,
  setJournalsItem,
  setJournalsListItem,
  setOnlyLinked,
  setCustomJournalMode,
  setCustomJournal,
  setSettingItem
} from '../../../actions/journals';

import { getSelectedValue, t } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { JOURNAL_SETTING_DATA_FIELD, JOURNAL_SETTING_ID_FIELD } from '../constants';
import DashboardService from '../../../services/dashboard';

import './JournalsDashletEditor.scss';

const mapStateToProps = (state, ownProps) => {
  const newState = state.journals[ownProps.stateId] || {};

  return {
    journalsList: newState.journalsList,
    journals: newState.journals,
    journalSettings: newState.journalSettings,
    config: newState.config,
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
    setJournalsListItem: item => dispatch(setJournalsListItem(w(item))),
    setJournalsItem: item => dispatch(setJournalsItem(w(item))),
    setSettingItem: id => dispatch(setSettingItem(w(id))),
    setOnlyLinked: onlyLinked => dispatch(setOnlyLinked(w(onlyLinked))),
    setCustomJournal: text => dispatch(setCustomJournal(w(text))),
    setCustomJournalMode: onlyLinked => dispatch(setCustomJournalMode(w(onlyLinked))),
    setDashletConfig: config => dispatch(setDashletConfig(w(config))),
    saveDashlet: (config, id) => dispatch(saveDashlet(w({ config: config, id: id })))
  };
};

class JournalsDashletEditor extends Component {
  static propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    recordRef: PropTypes.string,
    className: PropTypes.string,
    measurer: PropTypes.object,
    config: PropTypes.object,
    journals: PropTypes.array,
    journalsList: PropTypes.array,
    journalSettings: PropTypes.array,
    onSave: PropTypes.func,
    setJournalsListItem: PropTypes.func,
    setJournalsItem: PropTypes.func
  };

  componentDidMount() {
    const { config, getDashletEditorData } = this.props;

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

    if (config && (prevConfig.journalsListId !== config.journalsListId || prevConfig.journalId !== config.journalId)) {
      getDashletEditorData(config);
    }

    if (editorMode && onSave && prevResultDashboard.status !== resultDashboard.status && resultDashboard.status) {
      setDashletConfigByParams(id, config);
      setEditorMode(false);
    }
  }

  cancel = () => {
    const { config, setEditorMode } = this.props;

    config && setEditorMode(false);
  };

  save = () => {
    let { config, id, recordRef, onSave, saveDashlet } = this.props;

    if (recordRef) {
      config = config && config.onlyLinked === undefined ? { ...config, onlyLinked: true } : config;
    }
    if (config.customJournalMode === undefined) {
      config.customJournalMode = false;
    }

    if (onSave) {
      onSave(id, { config });
    } else {
      saveDashlet(config, id);
    }
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

  render() {
    const { className, measurer, recordRef, journals, journalsList, journalSettings, setJournalsListItem, setJournalsItem } = this.props;
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

          <Field label={t('journals.list.name')} isSmall={isSmall}>
            <Select
              className={'ecos-journal-dashlet-editor__select'}
              placeholder={t('journals.action.select-journal-list')}
              options={journalsList}
              getOptionLabel={option => option.title}
              getOptionValue={option => option.id}
              onChange={setJournalsListItem}
              value={getSelectedValue(journalsList, 'id', config.journalsListId)}
            />
          </Field>

          {config.customJournalMode ? (
            <Field label={t('journals.action.custom-journal')} isSmall={isSmall}>
              <Input value={config.customJournal || ''} onChange={this.setCustomJournal} type="text" />
            </Field>
          ) : (
            <>
              <Field label={t('journals.name')} isSmall={isSmall}>
                <Select
                  className={'ecos-journal-dashlet-editor__select'}
                  placeholder={t('journals.action.select-journal')}
                  options={journals}
                  getOptionLabel={option => option.title}
                  getOptionValue={option => option.nodeRef}
                  onChange={setJournalsItem}
                  value={getSelectedValue(journals, 'nodeRef', config.journalId)}
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
