import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import Columns from '../../common/templates/Columns/Columns';
import { Caption, Select, Field } from '../../common/form';
import { Btn } from '../../common/btns';

import {
  getDashletEditorData,
  setJournalsListItem,
  setJournalsItem,
  setSettingItem,
  saveDashlet,
  setEditorMode,
  setDashletConfig
} from '../../../actions/journals';

import { t, getSelectedValue } from '../../../helpers/util';
import { JOURNAL_SETTING_ID_FIELD, JOURNAL_SETTING_DATA_FIELD } from '../constants';

import './JournalsDashletEditor.scss';

const mapStateToProps = state => ({
  journalsList: state.journals.journalsList,
  journals: state.journals.journals,
  journalSettings: state.journals.journalSettings,
  config: state.journals.config,
  initConfig: state.journals.initConfig
});

const mapDispatchToProps = dispatch => ({
  setEditorMode: visible => dispatch(setEditorMode(visible)),
  getDashletEditorData: config => dispatch(getDashletEditorData(config)),
  setJournalsListItem: item => dispatch(setJournalsListItem(item)),
  setJournalsItem: item => dispatch(setJournalsItem(item)),
  setSettingItem: id => dispatch(setSettingItem(id)),
  setDashletConfig: config => dispatch(setDashletConfig(config)),
  saveDashlet: (config, id) => dispatch(saveDashlet({ config: config, id: id }))
});

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
    const props = this.props;
    props.saveDashlet(props.config, props.id);
  };

  clear = () => {
    this.props.setDashletConfig(this.props.initConfig);
  };

  setSettingItem = item => {
    this.props.setSettingItem(item[JOURNAL_SETTING_ID_FIELD]);
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

    return (
      <div className={cssClasses}>
        <div className={'ecos-journal-dashlet-editor__body'}>
          <Caption middle className={'ecos-journal-dashlet-editor__caption'}>
            {t('journals.action.edit-dashlet')}
          </Caption>
          <Field label={t('journals.list.name')}>
            <Select
              placeholder={t('journals.action.select-journal-list')}
              options={props.journalsList}
              getOptionLabel={option => option.title}
              getOptionValue={option => option.id}
              onChange={props.setJournalsListItem}
              value={getSelectedValue(props.journalsList, 'id', config.journalsListId)}
            />
          </Field>

          <Field label={t('journals.name')}>
            <Select
              placeholder={t('journals.action.select-journal')}
              options={props.journals}
              getOptionLabel={option => option.title}
              getOptionValue={option => option.nodeRef}
              onChange={props.setJournalsItem}
              value={getSelectedValue(props.journals, 'nodeRef', config.journalId)}
            />
          </Field>

          <Field label={t('journals.settings')}>
            <Select
              placeholder={t('journals.default')}
              options={props.journalSettings}
              getOptionLabel={option => option[JOURNAL_SETTING_DATA_FIELD].title}
              getOptionValue={option => option[JOURNAL_SETTING_ID_FIELD]}
              onChange={this.setSettingItem}
              value={getSelectedValue(props.journalSettings, JOURNAL_SETTING_ID_FIELD, config.journalSettingId)}
            />
          </Field>
        </div>

        <Columns
          className={'ecos-journal-dashlet-editor__actions'}
          cols={[
            <Btn onClick={this.clear}>{t('journals.action.reset-settings')}</Btn>,

            <Fragment>
              <Btn className={'ecos-btn_x-step_10'} onClick={this.cancel}>
                {t('journals.action.cancel')}
              </Btn>
              <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.save}>
                {t('journals.action.save')}
              </Btn>
            </Fragment>
          ]}
          cfgs={[{}, { className: 'columns_right' }]}
        />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletEditor);
