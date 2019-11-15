import React, { Component } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import { Caption, Select, Field, Checkbox } from '../../common/form';
import { Btn } from '../../common/btns';

import {
  getDashletEditorData,
  setJournalsListItem,
  setJournalsItem,
  setSettingItem,
  saveDashlet,
  setEditorMode,
  setDashletConfig,
  setOnlyLinked
} from '../../../actions/journals';

import { t, getSelectedValue } from '../../../helpers/util';
import { wrapArgs } from '../../../helpers/redux';
import { JOURNAL_SETTING_ID_FIELD, JOURNAL_SETTING_DATA_FIELD } from '../constants';

import './JournalsDashletEditor.scss';

const mapStateToProps = (state, props) => {
  const newState = state.journals[props.stateId] || {};

  return {
    journalsList: newState.journalsList,
    journals: newState.journals,
    journalSettings: newState.journalSettings,
    config: newState.config,
    initConfig: newState.initConfig
  };
};

const mapDispatchToProps = (dispatch, props) => {
  const w = wrapArgs(props.stateId);

  return {
    setEditorMode: visible => dispatch(setEditorMode(w(visible))),
    getDashletEditorData: config => dispatch(getDashletEditorData(w(config))),
    setJournalsListItem: item => dispatch(setJournalsListItem(w(item))),
    setJournalsItem: item => dispatch(setJournalsItem(w(item))),
    setSettingItem: id => dispatch(setSettingItem(w(id))),
    setOnlyLinked: onlyLinked => dispatch(setOnlyLinked(w(onlyLinked))),
    setDashletConfig: config => dispatch(setDashletConfig(w(config))),
    saveDashlet: (config, id) => dispatch(saveDashlet(w({ config: config, id: id })))
  };
};

class JournalsDashletEditor extends Component {
  componentDidMount() {
    this.props.getDashletEditorData(this.props.config);
  }

  cancel = () => {
    if (this.props.config) {
      this.props.setEditorMode(false);
    }
  };

  save = () => {
    let { config, id, saveDashlet, recordRef } = this.props;

    if (recordRef) {
      config = config && config.onlyLinked === undefined ? { ...config, onlyLinked: true } : config;
    }

    saveDashlet(config, id);
  };

  clear = () => {
    this.props.setDashletConfig(this.props.initConfig);
  };

  setSettingItem = item => {
    this.props.setSettingItem(item[JOURNAL_SETTING_ID_FIELD]);
  };

  setOnlyLinked = ({ checked }) => {
    this.props.setOnlyLinked(checked);
  };

  componentDidUpdate(prevProps) {
    const prevConfig = prevProps.config || {};
    const config = this.props.config || {};

    if (prevConfig.journalsListId !== config.journalsListId || prevConfig.journalId !== config.journalId) {
      this.props.getDashletEditorData(config);
    }
  }

  render() {
    const props = this.props;
    const config = props.config || {};
    const cssClasses = classNames('ecos-journal-dashlet-editor', props.className);
    const measurer = props.measurer;
    const isSmall = measurer.xxs || measurer.xxxs;
    const checkSmall = isSmall => className => (isSmall ? className : '');
    const ifSmall = checkSmall(isSmall);

    return (
      <div className={cssClasses}>
        <div className={classNames('ecos-journal-dashlet-editor__body', ifSmall('ecos-journal-dashlet-editor__body_small'))}>
          <Caption middle className={classNames('ecos-journal-dashlet-editor__caption')}>
            {t('journals.action.edit-dashlet')}
          </Caption>

          <Field label={t('journals.list.name')} isSmall={isSmall}>
            <Select
              className={'ecos-journal-dashlet-editor__select'}
              placeholder={t('journals.action.select-journal-list')}
              options={props.journalsList}
              getOptionLabel={option => option.title}
              getOptionValue={option => option.id}
              onChange={props.setJournalsListItem}
              value={getSelectedValue(props.journalsList, 'id', config.journalsListId)}
            />
          </Field>

          <Field label={t('journals.name')} isSmall={isSmall}>
            <Select
              className={'ecos-journal-dashlet-editor__select'}
              placeholder={t('journals.action.select-journal')}
              options={props.journals}
              getOptionLabel={option => option.title}
              getOptionValue={option => option.nodeRef}
              onChange={props.setJournalsItem}
              value={getSelectedValue(props.journals, 'nodeRef', config.journalId)}
            />
          </Field>

          <Field label={t('journals.settings')} isSmall={isSmall}>
            <Select
              className={'ecos-journal-dashlet-editor__select'}
              placeholder={t('journals.default')}
              options={props.journalSettings}
              getOptionLabel={option => option[JOURNAL_SETTING_DATA_FIELD].title}
              getOptionValue={option => option[JOURNAL_SETTING_ID_FIELD]}
              onChange={this.setSettingItem}
              value={getSelectedValue(props.journalSettings, JOURNAL_SETTING_ID_FIELD, config.journalSettingId)}
            />
          </Field>

          {props.recordRef ? (
            <Field label={t('journals.action.only-linked')} isSmall={isSmall}>
              <Checkbox checked={config.onlyLinked === undefined ? true : config.onlyLinked} onChange={this.setOnlyLinked} />
            </Field>
          ) : null}
        </div>

        <div className={classNames('ecos-journal-dashlet-editor__actions', ifSmall('ecos-journal-dashlet-editor__actions_small'))}>
          <Btn
            className={classNames(`ecos-btn_x-step_10`, ifSmall('ecos-journal-dashlet-editor_small-btn_full-width'))}
            onClick={this.clear}
          >
            {t('journals.action.reset-settings')}
          </Btn>

          <Btn
            className={classNames(
              `ecos-btn_blue ecos-btn_hover_light-blue ecos-btn_float_right`,
              ifSmall('ecos-journal-dashlet-editor_small-btn')
            )}
            onClick={this.save}
          >
            {t('journals.action.save')}
          </Btn>

          <Btn
            className={classNames(
              `ecos-btn_x-step_10 ecos-btn_float_right`,
              ifSmall('ecos-journal-dashlet-editor_small-btn ecos-btn_float_left')
            )}
            onClick={this.cancel}
          >
            {t('journals.action.cancel')}
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
