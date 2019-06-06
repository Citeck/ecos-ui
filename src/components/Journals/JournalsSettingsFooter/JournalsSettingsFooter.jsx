import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import Columns from '../../common/templates/Columns/Columns';
import EcosModal from '../../../../src/components/common/EcosModal';
import { Btn } from '../../common/btns';
import { Input } from '../../common/form';
import { reloadGrid, saveJournalSetting, createJournalSetting, initJournalSettingData } from '../../../actions/journals';
import { JOURNAL_SETTING_ID_FIELD } from '../constants';
import { t, trigger } from '../../../helpers/util';

import './JournalsSettingsFooter.scss';

const mapStateToProps = state => ({
  predicate: state.journals.predicate,
  columnsSetup: state.journals.columnsSetup,
  grouping: state.journals.grouping,
  journalSetting: state.journals.journalSetting
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: options => dispatch(reloadGrid(options)),
  saveJournalSetting: (id, settings) => dispatch(saveJournalSetting({ id, settings })),
  createJournalSetting: (journalId, settings) => dispatch(createJournalSetting({ journalId, settings })),
  initJournalSettingData: journalSetting => dispatch(initJournalSettingData(journalSetting))
});

class JournalsSettingsFooter extends Component {
  constructor(props) {
    super(props);

    this.state = { dialogOpen: false };
    this.settingName = '';
  }

  createSetting = () => {
    if (this.settingName) {
      this.props.createJournalSetting(this.props.journalId, this.getSetting(this.settingName));
      this.closeDialog();
      trigger.call(this, 'onCreate');
    }
  };

  saveSetting = () => {
    const journalSetting = this.getSetting();
    this.props.saveJournalSetting(journalSetting[[JOURNAL_SETTING_ID_FIELD]], this.getSetting());
    trigger.call(this, 'onSave');
  };

  applySetting = () => {
    let journalSetting = this.getSetting();
    const { columns, groupBy, sortBy, predicate } = journalSetting;

    this.props.reloadGrid({ columns, groupBy, sortBy, predicates: predicate ? [predicate] : [] });
    trigger.call(this, 'onApply');
  };

  cancelSetting = () => {
    const { initJournalSettingData, journalSetting } = this.props;
    initJournalSettingData(journalSetting);
    trigger.call(this, 'onCancel');
  };

  getSetting = title => {
    let { journalSetting, grouping, columnsSetup, predicate } = this.props;

    return {
      ...journalSetting,
      sortBy: columnsSetup.sortBy,
      groupBy: grouping.groupBy,
      columns: grouping.groupBy.length ? grouping.columns : columnsSetup.columns,
      predicate: predicate,
      title: title || journalSetting.title
    };
  };

  closeDialog = () => {
    this.setState({ dialogOpen: false });
    this.clearSettingName();
  };

  openDialog = () => {
    this.setState({ dialogOpen: true });
  };

  clearSettingName = () => {
    this.settingName = '';
  };

  onChangeSettingName = e => {
    this.settingName = e.target.value;
  };

  onDialogCalculateBounds = () => {
    if (this.settingTitleInputRef) {
      this.settingTitleInputRef.current.focus();
    }
  };

  getSettingTitleInputRef = ref => {
    this.settingTitleInputRef = ref;
  };

  render() {
    const { journalSetting } = this.props;

    return (
      <Fragment>
        <Columns
          className={'ecos-journal__settings-footer'}
          cols={[
            <Fragment>
              <Btn className={'ecos-btn_x-step_10'} onClick={this.openDialog}>
                {t('journals.action.create-template')}
              </Btn>
              {journalSetting[JOURNAL_SETTING_ID_FIELD] && <Btn onClick={this.saveSetting}>{t('journals.action.apply-template')}</Btn>}
            </Fragment>,

            <Fragment>
              <Btn className={'ecos-btn_x-step_10'} onClick={this.cancelSetting}>
                {t('journals.action.reset')}
              </Btn>
              <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.applySetting}>
                {t('journals.action.apply')}
              </Btn>
            </Fragment>
          ]}
          cfgs={[{}, { className: 'columns_right' }]}
        />

        <EcosModal
          title={t('journals.action.dialog-msg')}
          isOpen={this.state.dialogOpen}
          hideModal={this.closeDialog}
          className={'journal__dialog ecos-modal_width-sm'}
          onCalculateBounds={this.onDialogCalculateBounds}
        >
          <div className={'journal__dialog-panel'}>
            <Input type="text" onChange={this.onChangeSettingName} getInputRef={this.getSettingTitleInputRef} />
          </div>

          <div className="journal__dialog-buttons">
            <Btn onClick={this.closeDialog}>{t('journals.action.cancel')}</Btn>
            <Btn onClick={this.createSetting} className={'ecos-btn_blue'}>
              {t('journals.action.save')}
            </Btn>
          </div>
        </EcosModal>
      </Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsSettingsFooter);
